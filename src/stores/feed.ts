import { create } from "zustand";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { connectToRelays, fetchGlobalFeed } from "../lib/nostr";

interface FeedState {
  notes: NDKEvent[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  loadFeed: () => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  notes: [],
  loading: false,
  connected: false,
  error: null,

  connect: async () => {
    try {
      set({ error: null });
      await connectToRelays();
      set({ connected: true });
    } catch (err) {
      set({ error: `Connection failed: ${err}` });
    }
  },

  loadFeed: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const notes = await fetchGlobalFeed(80);
      set({ notes, loading: false });
    } catch (err) {
      set({ error: `Feed failed: ${err}`, loading: false });
    }
  },
}));
