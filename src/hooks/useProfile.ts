import { useEffect, useState } from "react";
import { fetchProfile } from "../lib/nostr";

const profileCache = new Map<string, any>();
const pendingRequests = new Map<string, Promise<any>>();

export function useProfile(pubkey: string) {
  const [profile, setProfile] = useState<any>(profileCache.get(pubkey) ?? null);

  useEffect(() => {
    if (profileCache.has(pubkey)) {
      setProfile(profileCache.get(pubkey));
      return;
    }

    // Deduplicate requests for the same pubkey
    if (!pendingRequests.has(pubkey)) {
      const request = fetchProfile(pubkey).then((p) => {
        profileCache.set(pubkey, p ?? null);
        pendingRequests.delete(pubkey);
        return p;
      }).catch(() => {
        pendingRequests.delete(pubkey);
        return null;
      });
      pendingRequests.set(pubkey, request);
    }

    pendingRequests.get(pubkey)!.then((p) => {
      setProfile(p ?? null);
    });
  }, [pubkey]);

  return profile;
}
