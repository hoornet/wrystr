import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";

export interface NostrProfile {
  npub: string;
  pubkey: string;
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string; // lightning address
  banner?: string;
}

export interface NostrNote {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  kind: NDKKind;
  tags: string[][];
  profile?: NostrProfile;
  event: NDKEvent;
}

export interface RelayInfo {
  url: string;
  connected: boolean;
  latencyMs?: number;
}
