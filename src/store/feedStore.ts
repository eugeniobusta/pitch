import { create } from 'zustand';
import type { IndustryType, StartupStage } from '@/types/database';

interface FeedState {
  activeIndex: number;
  isMuted: boolean;
  seenIds: Set<string>;
  filterIndustry: IndustryType | null;
  filterStage: StartupStage | null;
  setActiveIndex: (i: number) => void;
  toggleMute: () => void;
  markSeen: (id: string) => void;
  setFilterIndustry: (v: IndustryType | null) => void;
  setFilterStage: (v: StartupStage | null) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  activeIndex: 0,
  isMuted: false,
  seenIds: new Set(),
  filterIndustry: null,
  filterStage: null,
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  markSeen: (id) =>
    set((s) => {
      const seenIds = new Set(s.seenIds);
      seenIds.add(id);
      return { seenIds };
    }),
  setFilterIndustry: (filterIndustry) => set({ filterIndustry }),
  setFilterStage: (filterStage) => set({ filterStage }),
}));
