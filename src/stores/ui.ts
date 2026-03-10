import { create } from "zustand";

import { NDKEvent } from "@nostr-dev-kit/ndk";

type View = "feed" | "search" | "relays" | "settings" | "profile" | "thread" | "article-editor" | "about";

interface UIState {
  currentView: View;
  sidebarCollapsed: boolean;
  selectedPubkey: string | null;
  selectedNote: NDKEvent | null;
  previousView: View;
  pendingSearch: string | null;
  setView: (view: View) => void;
  openProfile: (pubkey: string) => void;
  openThread: (note: NDKEvent, from: View) => void;
  openSearch: (query: string) => void;
  goBack: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set, _get) => ({
  currentView: "feed",
  sidebarCollapsed: false,
  selectedPubkey: null,
  selectedNote: null,
  previousView: "feed",
  pendingSearch: null,
  setView: (currentView) => set({ currentView }),
  openProfile: (pubkey) => set((s) => ({ currentView: "profile", selectedPubkey: pubkey, previousView: s.currentView as View })),
  openThread: (note, from) => set({ currentView: "thread", selectedNote: note, previousView: from }),
  openSearch: (query) => set({ currentView: "search", pendingSearch: query }),
  goBack: () => set((s) => ({
    currentView: s.previousView !== s.currentView ? s.previousView : "feed",
    selectedNote: null,
  })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
