import type { ProblemDataPayload } from '@shared/types/problem';
import { create } from 'zustand';

type BattleProblemState = {
  problem: ProblemDataPayload | null;
  timeOffset: number;
  setProblem: (problem: ProblemDataPayload) => void;
  setTimeOffset: (offset: number) => void;
  clearProblem: () => void;
};

export const useBattleProblemStore = create<BattleProblemState>((set) => ({
  problem: null,
  timeOffset: 0,
  setProblem: (problem) => set({ problem }),
  setTimeOffset: (timeOffset) => set({ timeOffset }),
  clearProblem: () => set({ problem: null, timeOffset: 0 }),
}));
