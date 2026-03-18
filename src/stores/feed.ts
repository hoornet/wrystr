import { create } from "zustand";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { connectToRelays, fetchGlobalFeed, fetchBatchEngagement, getNDK } from "../lib/nostr";
import { dbLoadFeed, dbSaveNotes } from "../lib/db";

const TRENDING_CACHE_KEY = "wrystr_trending_cache";
const TRENDING_TTL = 10 * 60 * 1000; // 10 minutes

interface FeedState {
  notes: NDKEvent[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  focusedNoteIndex: number;
  trendingNotes: NDKEvent[];
  trendingLoading: boolean;
  connect: () => Promise<void>;
  loadCachedFeed: () => Promise<void>;
  loadFeed: () => Promise<void>;
  loadTrendingFeed: (force?: boolean) => Promise<void>;
  setFocusedNoteIndex: (n: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  notes: [],
  loading: false,
  connected: false,
  error: null,
  focusedNoteIndex: -1,
  trendingNotes: [],
  trendingLoading: false,
  setFocusedNoteIndex: (n: number) => set({ focusedNoteIndex: n }),

  connect: async () => {
    try {
      set({ error: null });
      await connectToRelays();
      set({ connected: true });

      // Monitor relay connectivity with grace period.
      // NDK relays can briefly show connected=false during WebSocket
      // reconnection cycles, so we require multiple consecutive "offline"
      // checks before flipping the indicator, and attempt reconnection.
      const ndk = getNDK();
      let offlineStreak = 0;
      const checkConnection = () => {
        const relays = Array.from(ndk.pool?.relays?.values() ?? []);
        const hasConnected = relays.some((r) => r.connected);
        if (hasConnected) {
          offlineStreak = 0;
          if (!get().connected) set({ connected: true });
        } else {
          offlineStreak++;
          // Only mark offline after 3 consecutive checks (15s grace)
          if (offlineStreak >= 3 && get().connected) {
            set({ connected: false });
            // Attempt reconnection
            ndk.connect().catch(() => {});
          }
        }
      };
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

  loadTrendingFeed: async (force?: boolean) => {
    if (get().trendingLoading) return;

    // Check cache first (skip if forced refresh)
    if (!force) {
      try {
        const cached = localStorage.getItem(TRENDING_CACHE_KEY);
        if (cached) {
          const { timestamp } = JSON.parse(cached) as { noteIds: string[]; timestamp: number };
          if (Date.now() - timestamp < TRENDING_TTL && get().trendingNotes.length > 0) {
            return; // Cache still valid and notes already in store
          }
        }
      } catch { /* ignore cache errors */ }
    }

    set({ trendingLoading: true });
    try {
      const notes = await fetchGlobalFeed(200);

      if (notes.length === 0) {
        set({ trendingNotes: [], trendingLoading: false });
        return;
      }

      const eventIds = notes.map((n) => n.id).filter(Boolean) as string[];
      const engagement = await fetchBatchEngagement(eventIds);

      const scored = notes
        .map((note) => {
          const eng = engagement.get(note.id) ?? { reactions: 0, replies: 0, zapSats: 0 };
          const score = eng.reactions * 1 + eng.replies * 3 + eng.zapSats * 0.01;
          return { note, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
        .map((s) => s.note);

      set({ trendingNotes: scored, trendingLoading: false });

      // Cache note IDs + timestamp
      localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify({
        noteIds: scored.map((n) => n.id),
        timestamp: Date.now(),
      }));
    } catch (err) {
      set({ error: `Trending failed: ${err}`, trendingLoading: false });
    }
  },
}));
