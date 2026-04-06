import { useEffect, useRef, useState } from "react";
import { fetchPollResponses } from "../lib/nostr";
import type { PollVotes } from "../lib/nostr";
import { useUserStore } from "../stores/user";

const cache = new Map<string, PollVotes>();

const pending = new Map<string, Promise<PollVotes>>();
let activeCount = 0;
const MAX_CONCURRENT = 4;
const queue: Array<() => void> = [];

function runNext() {
  if (queue.length > 0 && activeCount < MAX_CONCURRENT) {
    const next = queue.shift()!;
    next();
  }
}

function throttledFetch(pollId: string, pubkey?: string): Promise<PollVotes> {
  if (pending.has(pollId)) return pending.get(pollId)!;

  const promise = new Promise<PollVotes>((resolve) => {
    const doFetch = () => {
      activeCount++;
      fetchPollResponses(pollId, pubkey)
        .then((result) => {
          resolve(result);
        })
        .catch(() => {
          resolve({ votes: new Map(), myVote: null, total: 0 });
        })
        .finally(() => {
          activeCount--;
          pending.delete(pollId);
          runNext();
        });
    };

    if (activeCount < MAX_CONCURRENT) {
      doFetch();
    } else {
      queue.push(doFetch);
    }
  });

  pending.set(pollId, promise);
  return promise;
}

export function usePollVotes(pollId: string): [PollVotes | null, (optionIndex: number) => void] {
  const [data, setData] = useState<PollVotes | null>(() => cache.get(pollId) ?? null);
  const pubkeyRef = useRef(useUserStore.getState().pubkey);

  useEffect(() => {
    pubkeyRef.current = useUserStore.getState().pubkey;
  });

  useEffect(() => {
    if (cache.has(pollId)) {
      setData(cache.get(pollId)!);
      return;
    }
    let cancelled = false;
    throttledFetch(pollId, pubkeyRef.current ?? undefined).then((result) => {
      if (!cancelled) {
        cache.set(pollId, result);
        setData(result);
      }
    });
    return () => { cancelled = true; };
  }, [pollId]);

  const addVote = (optionIndex: number) => {
    setData((prev) => {
      const votes = new Map(prev?.votes ?? []);
      // If changing vote, decrement old option
      if (prev?.myVote !== null && prev?.myVote !== undefined) {
        const oldCount = votes.get(prev.myVote) ?? 0;
        if (oldCount > 1) votes.set(prev.myVote, oldCount - 1);
        else votes.delete(prev.myVote);
      }
      votes.set(optionIndex, (votes.get(optionIndex) ?? 0) + 1);
      const total = Array.from(votes.values()).reduce((sum, n) => sum + n, 0);
      const next: PollVotes = { votes, myVote: optionIndex, total };
      cache.set(pollId, next);
      return next;
    });
  };

  return [data, addVote];
}
