import NDK, { NDKEvent, NDKFilter, NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";

const DEFAULT_RELAYS = [
  "ws://umbrel.local:4848",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

let ndk: NDK | null = null;

export function getNDK(): NDK {
  if (!ndk) {
    ndk = new NDK({
      explicitRelayUrls: DEFAULT_RELAYS,
    });
  }
  return ndk;
}

function waitForConnectedRelay(instance: NDK, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Even on timeout, continue — some relays may connect later
      console.warn("Relay connection timeout, continuing anyway");
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

export async function fetchGlobalFeed(limit: number = 50): Promise<NDKEvent[]> {
  const instance = getNDK();

  const filter: NDKFilter = {
    kinds: [NDKKind.Text],
    limit,
  };

  const events = await instance.fetchEvents(filter, {
    cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
  });

  return Array.from(events).sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
}

export async function fetchProfile(pubkey: string) {
  const instance = getNDK();
  const user = instance.getUser({ pubkey });
  await user.fetchProfile();
  return user.profile;
}
