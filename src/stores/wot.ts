import { create } from "zustand";
import { buildWoTSet } from "../lib/nostr/wot";

interface WoTState {
  enabled: boolean;
  wotSet: Set<string>;
  loading: boolean;
  lastBuilt: number | null;
  setEnabled: (v: boolean) => void;
  buildWoT: (myPubkey: string, follows: string[]) => Promise<void>;
}

const WOT_ENABLED_KEY = "vega_wot_enabled";

export const useWoTStore = create<WoTState>((set) => ({
  enabled: localStorage.getItem(WOT_ENABLED_KEY) === "true",
  wotSet: new Set(),
  loading: false,
  lastBuilt: null,
  setEnabled: (v) => {
    localStorage.setItem(WOT_ENABLED_KEY, String(v));
    set({ enabled: v });
  },
  buildWoT: async (myPubkey, follows) => {
    set({ loading: true });
    try {
      const wotSet = await buildWoTSet(myPubkey, follows);
      set({ wotSet, lastBuilt: Date.now() });
    } finally {
      set({ loading: false });
    }
  },
}));
