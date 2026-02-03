import { TestcaseStatus } from '@packages/types/pubsub';

import { PubsubService } from '../pubsub/pubsub.service';
import { JudgeChecker } from './judge.checker';
import { JudgeReader } from './judge.reader';
import { Testcase } from './judge.types';

interface OutputResults {
  input: string;
  output: string;
  expectedOutput: string;
}

export interface TestcaseResult {
  index: number;
  status: TestcaseStatus; // ACCEPTED, WRONG_ANSWER 등
  time: number;
  memory: number;
  results: OutputResults;
}

export interface FinalResult {
  status: TestcaseStatus;
  passed: number;
  total: number;
  time: number;
  memory: number;
  testcases: TestcaseResult[];
}

export class JudgeContext {
  private lastProcessedIndex = -1;
  private passed = 0;
  private maxTime = 0;
  private maxMemory = 0;
  private finalStatus: TestcaseStatus = 'ACCEPTED';
  private readonly testcaseResults: TestcaseResult[] = [];

  constructor(
    public readonly submissionId: string,
    private readonly testcases: Testcase[],
    private readonly reader: JudgeReader,
    private readonly checker: JudgeChecker,
    private readonly pubsub: PubsubService,
    private readonly socketId?: string,
  ) {}

  hasNewOutput(): boolean {
    const nextIndex = this.lastProcessedIndex + 1;
    return (
      nextIndex < this.testcases.length && this.reader.hasOutputFile(this.submissionId, nextIndex)
    );
  }

  async process(): Promise<void> {
    for (let i = this.lastProcessedIndex + 1; i < this.testcases.length; i++) {
      if (!this.reader.hasOutputFile(this.submissionId, i)) break;

      const outputResult = this.reader.readOutputFile(this.submissionId, i);
      const testcase = this.testcases[i];
      const { time, memory, status: runnerStatus } = outputResult;

      // ACCEPTED인 경우에만 output 비교하여 WRONG_ANSWER 판정
      let tcStatus: TestcaseStatus = runnerStatus;
      if (runnerStatus === 'ACCEPTED') {
        const isCorrect = this.checker.compare(outputResult.output, testcase.output);
        tcStatus = isCorrect ? 'ACCEPTED' : 'WRONG_ANSWER';
      }

      const results = {
        input: testcase.input,
        output: this.checker.normalize(outputResult.output),
        expectedOutput: testcase.output,
      } as OutputResults;

      await this.publishUpdate(i, tcStatus, time, memory, results);
      this.testcaseResults.push({
        index: i + 1,
        status: tcStatus,
        time,
        memory,
        results,
      });
      this.updateStatistics(tcStatus, time, memory);

      this.lastProcessedIndex = i;
    }
  }

  isAllCompleted(): boolean {
    return this.lastProcessedIndex === this.testcases.length - 1;
  }

  async reportFinalResult(): Promise<void> {
    const submissionId = this.submissionId as unknown as string;
    await this.pubsub.publishFinalResult({
      type: 'FINAL_RESULT',
      submissionId,
      socketId: this.socketId,
      status: this.finalStatus,
      result: {
        passed: this.passed,
        total: this.testcases.length,
        time: this.maxTime,
        memory: this.maxMemory,
      },
    });
  }

  getSummary() {
    return {
      passed: this.passed,
      total: this.testcases.length,
    };
  }

  // 채점 완료된 데이터를 Redis에 저장할 최종 결과
  getFinalResult(): FinalResult {
    return {
      status: this.finalStatus,
      passed: this.passed,
      total: this.testcases.length,
      time: this.maxTime,
      memory: this.maxMemory,
      testcases: this.testcaseResults,
    };
  }

  private async publishUpdate(
    index: number,
    status: TestcaseStatus,
    time: number,
    memory: number,
    results: OutputResults,
  ) {
    const submissionId = this.submissionId as unknown as string;
    await this.pubsub.publishTestcaseUpdate({
      type: 'TESTCASE_UPDATE',
      submissionId,
      socketId: this.socketId,
      testcase: { index: index + 1, status, time, memory },
      progress: {
        completed: index + 1,
        passed: status === 'ACCEPTED' ? this.passed + 1 : this.passed,
        total: this.testcases.length,
      },
      results,
    });
  }

  private updateStatistics(status: TestcaseStatus, time: number, memory: number) {
    if (status === 'ACCEPTED') {
      this.passed++;
      this.maxTime = Math.max(this.maxTime, time);
      this.maxMemory = Math.max(this.maxMemory, memory);
    } else {
      this.finalStatus = 'WRONG_ANSWER';
    }
  }
}
