export interface ProblemData {
  id: string;
  source: string;
  difficulty: string;
  tags: string | string[];
  url: string;
  title: string;
  time_limit: number;
  memory_limit: number;
  statement: string;
  input: string;
  output: string;
  note: string;
  examples: { input: string; output: string }[];
  testcases: { input: string; output: string }[];
}
