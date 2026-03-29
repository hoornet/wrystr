import { useEffect, useState } from "react";
import { verifyReputation } from "../lib/nostr";
import type { ReputationResult } from "../lib/nostr";
import { useUserStore } from "../stores/user";

const cache = new Map<string, ReputationResult | null>();
const pending = new Map<string, Promise<ReputationResult | null>>();

export function useReputation(pubkey: string): { data: ReputationResult | null; loading: boolean } {
  const [data, setData] = useState<ReputationResult | null>(() => cache.get(pubkey) ?? null);
  const [loading, setLoading] = useState(!cache.has(pubkey));
  const loggedIn = useUserStore((s) => s.loggedIn);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }

    if (cache.has(pubkey)) {
      setData(cache.get(pubkey)!);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent requests
    if (!pending.has(pubkey)) {
      const request = verifyReputation(pubkey).then((result) => {
        cache.set(pubkey, result);
        pending.delete(pubkey);
        return result;
      });
      pending.set(pubkey, request);
    }

    setLoading(true);
    pending.get(pubkey)!.then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [pubkey, loggedIn]);

  return { data, loading };
}
