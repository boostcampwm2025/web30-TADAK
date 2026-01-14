export interface Metadata {
  problemId: number;
  timeLimit: number;
  memoryLimit: number;
  type: 'TEST' | 'SUBMISSION';
}

export interface Testcase {
  id: number;
  input: string;
  output: string;
}
