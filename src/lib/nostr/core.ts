import NDK, { NDKEvent, NDKFilter, NDKRelay, NDKRelaySet, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { debug } from "../debug";

// ─── Fetch timeout helper ───────────────────────────────────────────

/** Race a promise against a timeout. Returns fallback on timeout. */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => {
      debug.warn(`[Vega] Fetch timed out after ${ms}ms`);
      resolve(fallback);
    }, ms)),
  ]);
}

export const FEED_TIMEOUT = 8000;    // 8s for feed fetches
export const THREAD_TIMEOUT = 5000;  // 5s per thread round-trip
export const SINGLE_TIMEOUT = 5000;  // 5s for single event lookups

// ─── Active fetch counter + concurrency semaphore ──────────────────
let _activeFetchCount = 0;
/** Number of in-flight fetchWithTimeout calls (subscriptions currently open). */
export function getActiveFetchCount(): number { return _activeFetchCount; }

// Hard cap on concurrent NDK subscriptions.
// Without this, rendering 200 cached notes triggers 400+ simultaneous subscriptions
// (useReplyCount + useZapCount per note), each receiving events from 7+ relays → OOM.
const MAX_CONCURRENT_FETCHES = 25;
const _fetchQueue: Array<() => void> = [];

function _runNextFetch() {
  while (_fetchQueue.length > 0 && _activeFetchCount < MAX_CONCURRENT_FETCHES) {
    const next = _fetchQueue.shift()!;
    next();
  }
}

/**
 * Fetch events with explicit subscription lifecycle.
 *
 * IMPORTANT: Do NOT use instance.fetchEvents() here. fetchEvents() creates an
 * NDK subscription internally that we cannot cancel if the timeout fires first.
 * Abandoned subscriptions keep receiving relay data forever, leaking memory.
 *
 * This implementation uses subscribe() directly so we can call sub.stop() on
 * both EOSE and timeout — guaranteeing no zombie subscriptions.
 *
 * Concurrency is capped at MAX_CONCURRENT_FETCHES. Excess calls queue and
 * start as slots free up.
 */
export function fetchWithTimeout(
  instance: NDK,
  filter: NDKFilter,
  timeoutMs: number,
  relaySet?: NDKRelaySet,
): Promise<Set<NDKEvent>> {
  return new Promise((resolve) => {
    const start = () => {
      const events = new Set<NDKEvent>();
      let settled = false;
      _activeFetchCount++;

      const finish = () => {
        if (settled) return;
        settled = true;
        _activeFetchCount--;
        clearTimeout(timer);
        try { sub.stop(); } catch { /* ignore */ }
        resolve(events);
        _runNextFetch();
      };

      const sub = instance.subscribe(
        filter,
        {
          cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
          groupable: false,
          closeOnEose: true,
        },
        relaySet,
      );

      sub.on("event", (event: NDKEvent) => {
        if (!settled) events.add(event);
      });
      sub.on("eose", finish);

      const timer = setTimeout(() => {
        debug.warn(`[Vega] Fetch timed out after ${timeoutMs}ms (collected ${events.size} events, queue: ${_fetchQueue.length})`);
        finish();
      }, timeoutMs);
    };

    if (_activeFetchCount < MAX_CONCURRENT_FETCHES) {
      start();
    } else {
      _fetchQueue.push(start);
    }
  });
}

export const RELAY_STORAGE_KEY = "wrystr_relays";

export const FALLBACK_RELAYS = [
  "wss://relay2.veganostr.com",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

// Override NDK's default outbox relays (purplepag.es can have DNS issues)
export const OUTBOX_RELAYS = [
  "wss://relay2.veganostr.com/",
  "wss://relay.damus.io/",
  "wss://nos.lol/",
  "wss://relay.nostr.band/",
];

/** Normalize relay URL: lowercase host, strip trailing slash, deduplicate. */
export function normalizeRelayUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const VEGA_RELAY = "wss://relay2.veganostr.com";
const VEGA_RELAY_MIGRATED_KEY = "wrystr_vega_relay_added";

export function getStoredRelayUrls(): string[] {
  try {
    const stored = localStorage.getItem(RELAY_STORAGE_KEY);
    if (stored) {
      // Deduplicate on load (handles legacy duplicates from trailing-slash mismatch)
      const urls: string[] = JSON.parse(stored);
      const seen = new Set<string>();
      const deduped = urls.map(normalizeRelayUrl).filter((u) => {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });

      // One-time: inject Vega relay for existing users
      if (!localStorage.getItem(VEGA_RELAY_MIGRATED_KEY)) {
        localStorage.setItem(VEGA_RELAY_MIGRATED_KEY, "1");
        if (!deduped.includes(VEGA_RELAY)) {
          deduped.unshift(VEGA_RELAY);
          saveRelayUrls(deduped);
        }
      }

      return deduped;
    }
  } catch { /* ignore */ }
  return FALLBACK_RELAYS;
}

export function saveRelayUrls(urls: string[]) {
  localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(urls.map(normalizeRelayUrl)));
}

let ndk: NDK | null = null;
let ndkCreatedAt: number | null = null;

export function getNDK(): NDK {
  if (!ndk) {
    ndk = new NDK({
      explicitRelayUrls: getStoredRelayUrls(),
      // outboxRelayUrls intentionally omitted — enabling NDK's outbox model causes
      // it to discover and connect to every event author's preferred relays, ballooning
      // the relay pool from 7 to 40+ and flooding startLiveFeed() with a firehose of
      // events from all those relays simultaneously → OOM crash.
    });
    ndkCreatedAt = Date.now();
  }
  return ndk;
}

export function getNDKUptimeMs(): number | null {
  return ndkCreatedAt ? Date.now() - ndkCreatedAt : null;
}

/**
 * Destroy the current NDK instance and create a fresh one.
 * Preserves the signer (login state) but resets all relay connections.
 * Use as a last resort when relay connections are unrecoverable.
 */
export async function resetNDK(): Promise<void> {
  const oldInstance = ndk;
  const oldSigner = oldInstance?.signer ?? null;

  // Only preserve the stored relay URLs — do NOT preserve outbox-discovered relays.
  // Outbox-discovered relays are the source of the relay pool explosion (7 → 40+).
  const storedUrls = getStoredRelayUrls();

  // Disconnect all relays on old instance
  if (oldInstance?.pool?.relays) {
    for (const relay of oldInstance.pool.relays.values()) {
      try { relay.disconnect(); } catch { /* ignore */ }
    }
  }

  // Create fresh instance with only the stored relay URLs
  ndk = new NDK({
    explicitRelayUrls: storedUrls,
    // outboxRelayUrls intentionally omitted — see getNDK() comment
  });
  ndkCreatedAt = Date.now();

  // Restore signer so user stays logged in
  if (oldSigner) {
    ndk.signer = oldSigner;
  }

  // Connect fresh
  debug.log("[Vega] NDK instance reset — connecting fresh relays");
  await ndk.connect();
  await waitForConnectedRelay(ndk, 5000);

  // Re-add local relay if enabled (dynamic import to avoid circular dependency)
  import("../localRelay").then(({ isLocalRelayEnabled, connectLocalRelay }) => {
    if (isLocalRelayEnabled()) {
      connectLocalRelay().catch(() => {});
    }
  }).catch(() => {});

  const relays = Array.from(ndk.pool?.relays?.values() ?? []);
  const connected = relays.filter((r) => r.connected).length;
  debug.log(`[Vega] Fresh connection: ${connected}/${relays.length} relays connected`);
}

export function addRelay(url: string): void {
  const normalized = normalizeRelayUrl(url);
  const instance = getNDK();
  const urls = getStoredRelayUrls();
  if (!urls.includes(normalized)) {
    saveRelayUrls([...urls, normalized]);
  }
  // Check both with and without trailing slash since NDK may use either
  if (!instance.pool?.relays.has(normalized) && !instance.pool?.relays.has(normalized + "/")) {
    const relay = new NDKRelay(normalized, undefined, instance);
    instance.pool?.addRelay(relay, true);
  }
}

export function removeRelay(url: string): void {
  const instance = getNDK();
  // NDK may store URLs with or without trailing slash — check both
  const variants = [url, url.replace(/\/$/, ""), url.replace(/\/?$/, "/")];
  for (const v of variants) {
    const relay = instance.pool?.relays.get(v);
    if (relay) {
      relay.disconnect();
      instance.pool?.relays.delete(v);
    }
  }
  saveRelayUrls(getStoredRelayUrls().filter((u) => u !== url));
}

function waitForConnectedRelay(instance: NDK, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, _reject) => {
    const timer = setTimeout(() => {
      // Even on timeout, continue — some relays may connect later
      debug.warn("Relay connection timeout, continuing anyway");
      resolve();
    }, timeoutMs);

    const check = () => {
      const relays = Array.from(instance.pool?.relays?.values() ?? []);
      const hasConnected = relays.some((r) => r.connected);
      if (hasConnected) {
        clearTimeout(timer);
        resolve();
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}

export async function connectToRelays(): Promise<void> {
  const instance = getNDK();
  await instance.connect();
  await waitForConnectedRelay(instance);
}

/**
 * Ensure at least one relay is connected.
 * If relays report connected, trust them and return immediately.
 * Only reconnect if zero relays are connected — never force-disconnect working connections.
 */
export async function ensureConnected(): Promise<boolean> {
  const instance = getNDK();
  const relays = Array.from(instance.pool?.relays?.values() ?? []);
  const connectedCount = relays.filter((r) => r.connected).length;

  if (connectedCount > 0) {
    return true; // Trust relay.connected — don't probe or disconnect
  }

  debug.warn(`[Vega] No relays connected (${relays.length} in pool) — attempting reconnect`);

  try {
    await withTimeout(instance.connect(), 4000, undefined);
    await waitForConnectedRelay(instance, 3000);
    const after = Array.from(instance.pool?.relays?.values() ?? []);
    const nowConnected = after.some((r) => r.connected);
    debug.log(`[Vega] Reconnect ${nowConnected ? "succeeded" : "failed"}`);
    return nowConnected;
  } catch {
    debug.error("[Vega] Reconnect failed");
    return false;
  }
}
