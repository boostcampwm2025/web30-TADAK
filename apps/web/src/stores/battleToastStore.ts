import { create } from 'zustand';

type BattleToastState = {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
};

export const useBattleToastStore = create<BattleToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));
