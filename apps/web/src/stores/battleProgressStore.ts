import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityLog = {
  type: 'TEST' | 'SUBMIT';
  passed: number;
  total: number;
  timestamp: number;
};

export type PlayerProgress = {
  passed: number;
  total: number;
  activityLogs: ActivityLog[];
};

type ProgressMap = Record<string, PlayerProgress>;

type State = {
  progresses: ProgressMap;
  upsertProgress: (userId: string, progress: { passed: number; total: number }) => void;
  addActivityLog: (
    userId: string,
    log: { type: 'TEST' | 'SUBMIT'; passed: number; total: number },
  ) => void;
  resetProgresses: () => void;
};

export const useBattleProgressStore = create<State>()(
  persist(
    (set) => ({
      progresses: {},
      upsertProgress: (userId, progress) =>
        set((s) => {
          const current = s.progresses[userId];
          const newLog: ActivityLog = {
            type: 'SUBMIT',
            passed: progress.passed,
            total: progress.total,
            timestamp: Date.now(),
          };
          return {
            progresses: {
              ...s.progresses,
              [userId]: {
                ...progress,
                activityLogs: [...(current?.activityLogs ?? []), newLog],
              },
            },
          };
        }),
      addActivityLog: (userId, log) =>
        set((s) => {
          const current = s.progresses[userId];
          const newLog: ActivityLog = {
            ...log,
            timestamp: Date.now(),
          };
          return {
            progresses: {
              ...s.progresses,
              [userId]: {
                passed: current?.passed ?? 0,
                total: current?.total ?? 0,
                activityLogs: [...(current?.activityLogs ?? []), newLog],
              },
            },
          };
        }),
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
