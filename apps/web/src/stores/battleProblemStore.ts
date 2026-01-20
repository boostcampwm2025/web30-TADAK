import type { ProblemDataPayload } from '@shared/types/problem';
import { create } from 'zustand';

type BattleProblemState = {
  problem: ProblemDataPayload | null;
  setProblem: (problem: ProblemDataPayload) => void;
  clearProblem: () => void;
};

export const useBattleProblemStore = create<BattleProblemState>((set) => ({
  problem: null,
  setProblem: (problem) => set({ problem }),
  clearProblem: () => set({ problem: null }),
}));
