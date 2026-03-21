import { create } from "zustand";

import { NDKEvent } from "@nostr-dev-kit/ndk";

type View = "feed" | "search" | "relays" | "settings" | "profile" | "thread" | "article-editor" | "article" | "articles" | "media" | "podcasts" | "about" | "zaps" | "dm" | "notifications" | "bookmarks" | "hashtag";
type FeedTab = "global" | "following" | "trending";

interface ViewStackEntry {
  view: View;
  selectedNote: NDKEvent | null;
  selectedPubkey: string | null;
}

const MAX_STACK = 20;

interface UIState {
  currentView: View;
  sidebarCollapsed: boolean;
  selectedPubkey: string | null;
  selectedNote: NDKEvent | null;
  previousView: View;
  viewStack: ViewStackEntry[];
  feedTab: FeedTab;
  pendingSearch: string | null;
  pendingDMPubkey: string | null;
  pendingArticleNaddr: string | null;
  pendingArticleEvent: NDKEvent | null;
  pendingHashtag: string | null;
  showHelp: boolean;
  feedLanguageFilter: string | null;
  setView: (view: View) => void;
  setFeedTab: (tab: FeedTab) => void;
  openProfile: (pubkey: string) => void;
  openThread: (note: NDKEvent, from?: View) => void;
  openSearch: (query: string) => void;
  openHashtag: (tag: string) => void;
  openDM: (pubkey: string) => void;
  openArticle: (naddr: string, event?: NDKEvent) => void;
  goBack: () => void;
  setFeedLanguageFilter: (filter: string | null) => void;
  toggleSidebar: () => void;
  toggleHelp: () => void;
}

const SIDEBAR_KEY = "wrystr_sidebar_collapsed";

export const useUIStore = create<UIState>((set, _get) => ({
  currentView: "feed",
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === "true",
  selectedPubkey: null,
  selectedNote: null,
  previousView: "feed",
  viewStack: [],
  feedTab: "global",
  pendingSearch: null,
  pendingDMPubkey: null,
  pendingArticleNaddr: null,
  pendingArticleEvent: null,
  pendingHashtag: null,
  showHelp: false,
  feedLanguageFilter: null,
  setView: (currentView) => set({ currentView }),
  setFeedTab: (feedTab) => set({ feedTab }),
  openProfile: (pubkey) => set((s) => {
    const stack = [...s.viewStack, { view: s.currentView, selectedNote: s.selectedNote, selectedPubkey: s.selectedPubkey }].slice(-MAX_STACK);
    return { currentView: "profile", selectedPubkey: pubkey, previousView: s.currentView as View, viewStack: stack };
  }),
  openThread: (note, _from) => set((s) => {
    const stack = [...s.viewStack, { view: s.currentView, selectedNote: s.selectedNote, selectedPubkey: s.selectedPubkey }].slice(-MAX_STACK);
    return { currentView: "thread", selectedNote: note, previousView: s.currentView as View, viewStack: stack };
  }),
  openSearch: (query) => set({ currentView: "search", pendingSearch: query }),
  openHashtag: (tag) => set((s) => {
    const stack = [...s.viewStack, { view: s.currentView, selectedNote: s.selectedNote, selectedPubkey: s.selectedPubkey }].slice(-MAX_STACK);
    return { currentView: "hashtag", pendingHashtag: tag, previousView: s.currentView as View, viewStack: stack };
  }),
  openDM: (pubkey) => set({ currentView: "dm", pendingDMPubkey: pubkey }),
  openArticle: (naddr, event) => set((s) => {
    const stack = [...s.viewStack, { view: s.currentView, selectedNote: s.selectedNote, selectedPubkey: s.selectedPubkey }].slice(-MAX_STACK);
    return { currentView: "article", pendingArticleNaddr: naddr, pendingArticleEvent: event ?? null, previousView: s.currentView as View, viewStack: stack };
  }),
  goBack: () => set((s) => {
    const stack = [...s.viewStack];
    const prev = stack.pop();
    if (prev) {
      return { showHelp: false, currentView: prev.view, selectedNote: prev.selectedNote, selectedPubkey: prev.selectedPubkey, viewStack: stack };
    }
    return { showHelp: false, currentView: "feed", selectedNote: null, viewStack: [] };
  }),
  setFeedLanguageFilter: (feedLanguageFilter) => set({ feedLanguageFilter }),
  toggleSidebar: () => set((s) => {
    const next = !s.sidebarCollapsed;
    localStorage.setItem(SIDEBAR_KEY, String(next));
    return { sidebarCollapsed: next };
  }),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
}));
