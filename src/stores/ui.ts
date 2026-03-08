import { create } from "zustand";

type View = "feed" | "relays" | "settings";

interface UIState {
  currentView: View;
  sidebarCollapsed: boolean;
  setView: (view: View) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: "feed",
  sidebarCollapsed: false,
  setView: (currentView) => set({ currentView }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
