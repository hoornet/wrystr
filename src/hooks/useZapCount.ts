import { useEffect, useState } from "react";
import { fetchZapCount } from "../lib/nostr";

interface ZapData { count: number; totalSats: number; }

const cache = new Map<string, ZapData>();
const pending = new Map<string, Promise<ZapData>>();
let activeCount = 0;
const MAX_CONCURRENT = 4;
const queue: Array<() => void> = [];

function runNext() {
  if (queue.length > 0 && activeCount < MAX_CONCURRENT) {
    const next = queue.shift()!;
    next();
  }
}

function throttledFetch(eventId: string): Promise<ZapData> {
  if (pending.has(eventId)) return pending.get(eventId)!;

  const promise = new Promise<ZapData>((resolve) => {
    const doFetch = () => {
      activeCount++;
      fetchZapCount(eventId)
        .then(resolve)
        .catch(() => resolve({ count: 0, totalSats: 0 }))
        .finally(() => {
          activeCount--;
          pending.delete(eventId);
          runNext();
        });
    };

    if (activeCount < MAX_CONCURRENT) {
      doFetch();
    } else {
      queue.push(doFetch);
    }
  });

  pending.set(eventId, promise);
  return promise;
}

export function useZapCount(eventId: string, enabled = true): ZapData | null {
  const [data, setData] = useState<ZapData | null>(() => cache.get(eventId) ?? null);

  useEffect(() => {
    if (!enabled) return;
    if (cache.has(eventId)) {
      setData(cache.get(eventId)!);
      return;
    }
    let cancelled = false;
    throttledFetch(eventId).then((d) => {
      if (!cancelled) {
        cache.set(eventId, d);
        setData(d);
      }
    });
    return () => { cancelled = true; };
  }, [eventId, enabled]);

  return data;
}
