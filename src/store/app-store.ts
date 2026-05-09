import { create } from 'zustand';

import { RecentEdit } from '@/types/editor';

interface AppState {
  recentEdits: RecentEdit[];
  isGuest: boolean;
  networkAvailable: boolean;

  addRecentEdit: (edit: RecentEdit) => void;
  removeRecentEdit: (id: string) => void;
  setNetworkAvailable: (v: boolean) => void;
  setIsGuest: (v: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  recentEdits: [],
  isGuest: true,
  networkAvailable: true,

  addRecentEdit: (edit) =>
    set((s) => ({
      recentEdits: [edit, ...s.recentEdits.filter((r) => r.id !== edit.id)].slice(0, 20),
    })),

  removeRecentEdit: (id) =>
    set((s) => ({ recentEdits: s.recentEdits.filter((r) => r.id !== id) })),

  setNetworkAvailable: (v) => set({ networkAvailable: v }),
  setIsGuest: (v) => set({ isGuest: v }),
}));
