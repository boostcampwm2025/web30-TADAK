import type { TestcaseUpdateMessage } from '@shared/types/pubsub';
import { create } from 'zustand';

export type ExecutionMode = 'TEST' | 'SUBMISSION' | null;
export type SubmissionProgress = TestcaseUpdateMessage['progress'];
export type TestcaseResult = TestcaseUpdateMessage['testcase'] & {
  results?: TestcaseUpdateMessage['results'];
};

type BattleExecutionState = {
  statusText: string;
  progress: SubmissionProgress | null;
  isTesting: boolean;
  isSubmitting: boolean;
  mode: ExecutionMode;
  testcaseResults: TestcaseResult[];
  setStatusText: (text: string) => void;
  setProgress: (progress: SubmissionProgress | null) => void;
  setIsTesting: (value: boolean) => void;
  setIsSubmitting: (value: boolean) => void;
  setMode: (mode: ExecutionMode) => void;
  setTestcaseResults: (results: TestcaseResult[]) => void;
  upsertTestcaseResult: (result: TestcaseResult) => void;
  reset: () => void;
};

const DEFAULT_STATUS = '대기 중';

export const useBattleExecutionStore = create<BattleExecutionState>((set) => ({
  statusText: DEFAULT_STATUS,
  progress: null,
  isTesting: false,
  isSubmitting: false,
  mode: null,
  testcaseResults: [],
  setStatusText: (statusText) => set({ statusText }),
  setProgress: (progress) => set({ progress }),
  setIsTesting: (isTesting) => set({ isTesting }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setMode: (mode) => set({ mode }),
  setTestcaseResults: (testcaseResults) => set({ testcaseResults }),
  upsertTestcaseResult: (result) =>
    set((state) => {
      const next = state.testcaseResults.filter((item) => item.index !== result.index);
      next.push(result);
      next.sort((a, b) => a.index - b.index);
      return { testcaseResults: next };
    }),
  reset: () =>
    set({
      statusText: DEFAULT_STATUS,
      progress: null,
      isTesting: false,
      isSubmitting: false,
      mode: null,
      testcaseResults: [],
    }),
}));
