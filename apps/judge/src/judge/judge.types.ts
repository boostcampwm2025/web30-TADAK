import type { TestcaseStatus } from '@packages/types/pubsub';

export type SubmissionJobType = 'TEST' | 'SUBMISSION';

export interface Metadata {
  problemId: string;
  timeLimit: number;
  memoryLimit: number;
  type: SubmissionJobType;
  socketId?: string;
}

export interface Testcase {
  id: number;
  input: string;
  output: string;
}

export interface OutputResult {
  input: string;
  output: string;
  time: number;
  memory: number;
  status: TestcaseStatus;
}
