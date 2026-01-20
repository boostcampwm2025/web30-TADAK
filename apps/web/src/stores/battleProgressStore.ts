import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlayerProgress = {
  passed: number;
  total: number;
};

type ProgressMap = Record<string, PlayerProgress>;

type State = {
  progresses: ProgressMap;
  upsertProgress: (userId: string, progress: PlayerProgress) => void;
  resetProgresses: () => void;
};

export const useBattleProgressStore = create<State>()(
  persist(
    (set) => ({
      progresses: {},
      upsertProgress: (userId, progress) =>
        set((s) => ({ progresses: { ...s.progresses, [userId]: progress } })),
      resetProgresses: () => set({ progresses: {} }),
    }),
    {
      name: 'battle-progress',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    },
  ),
);
