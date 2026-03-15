import { create } from "zustand";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { connectToRelays, fetchGlobalFeed, getNDK } from "../lib/nostr";
import { dbLoadFeed, dbSaveNotes } from "../lib/db";

interface FeedState {
  notes: NDKEvent[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  focusedNoteIndex: number;
  connect: () => Promise<void>;
  loadCachedFeed: () => Promise<void>;
  loadFeed: () => Promise<void>;
  setFocusedNoteIndex: (n: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  notes: [],
  loading: false,
  connected: false,
  error: null,
  focusedNoteIndex: -1,
  setFocusedNoteIndex: (n: number) => set({ focusedNoteIndex: n }),

  connect: async () => {
    try {
      set({ error: null });
      await connectToRelays();
      set({ connected: true });

      // Monitor relay connectivity — update status if all relays disconnect
      const ndk = getNDK();
      const checkConnection = () => {
        const relays = Array.from(ndk.pool?.relays?.values() ?? []);
        const hasConnected = relays.some((r) => r.connected);
        if (get().connected !== hasConnected) {
          set({ connected: hasConnected });
        }
      };
      // Re-check periodically (relay reconnects, disconnects)
      setInterval(checkConnection, 5000);
    } catch (err) {
      set({ error: `Connection failed: ${err}` });
    }
  },

  loadCachedFeed: async () => {
    try {
      const rawNotes = await dbLoadFeed(200);
      if (rawNotes.length === 0) return;
      const ndk = getNDK();
      const events = rawNotes.map((raw) => new NDKEvent(ndk, JSON.parse(raw)));
      set({ notes: events });
    } catch {
      // Cache read failure is non-critical
    }
  },

  loadFeed: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const fresh = await fetchGlobalFeed(80);

      // Merge with currently displayed notes so cached notes aren't lost
      // if the relay returns fewer results than the cache had.
      const freshIds = new Set(fresh.map((n) => n.id));
      const kept = get().notes.filter((n) => !freshIds.has(n.id));
      const merged = [...fresh, ...kept]
        .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
        .slice(0, 200);

      set({ notes: merged, loading: false, focusedNoteIndex: -1 });

      // Persist fresh notes to SQLite (fire-and-forget)
      dbSaveNotes(fresh.map((e) => JSON.stringify(e.rawEvent())));
    } catch (err) {
      set({ error: `Feed failed: ${err}`, loading: false });
    }
  },
}));
