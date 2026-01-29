export interface SubmissionDetail {
  id: string;
  code: string;
  language: string;
  problem: {
    title: string;
    source: string;
    difficulty: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    statement: string;
    input: string;
    output: string;
    examples: { input: string; output: string }[];
  };
}
