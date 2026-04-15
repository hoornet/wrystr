import { useEffect, useState } from "react";
import { fetchReplyCount } from "../lib/nostr";

const cache = new Map<string, number>();
const pending = new Map<string, Promise<number>>();
let activeCount = 0;
const MAX_CONCURRENT = 6;
const queue: Array<() => void> = [];

function runNext() {
  if (queue.length > 0 && activeCount < MAX_CONCURRENT) {
    const next = queue.shift()!;
    next();
  }
}

function throttledFetch(eventId: string): Promise<number> {
  if (pending.has(eventId)) return pending.get(eventId)!;

  const promise = new Promise<number>((resolve) => {
    const doFetch = () => {
      activeCount++;
      fetchReplyCount(eventId)
        .then(resolve)
        .catch(() => resolve(0))
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

export function useReplyCount(eventId: string, enabled = true): [number | null, (delta: number) => void] {
  const [count, setCount] = useState<number | null>(() => cache.get(eventId) ?? null);

  useEffect(() => {
    if (!enabled) return;
    if (cache.has(eventId)) {
      setCount(cache.get(eventId)!);
      return;
    }
    let cancelled = false;
    throttledFetch(eventId).then((n) => {
      if (!cancelled) {
        cache.set(eventId, n);
        setCount(n);
      }
    });
    return () => { cancelled = true; };
  }, [eventId, enabled]);

  const adjust = (delta: number) => {
    setCount((prev) => {
      const next = (prev ?? 0) + delta;
      cache.set(eventId, next);
      return next;
    });
  };

  return [count, adjust];
}
