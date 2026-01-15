import { TestcaseStatus } from '@packages/types/pubsub';

import { PubsubService } from '../pubsub/pubsub.service';
import { JudgeChecker } from './judge.checker';
import { JudgeReader } from './judge.reader';
import { Testcase } from './judge.types';

export class JudgeContext {
  private lastProcessedIndex = -1;
  private passed = 0;
  private maxTime = 0;
  private maxMemory = 0;
  private finalStatus: TestcaseStatus = 'ACCEPTED';

  constructor(
    public readonly submissionId: number,
    private readonly testcases: Testcase[],
    private readonly reader: JudgeReader,
    private readonly checker: JudgeChecker,
    private readonly pubsub: PubsubService,
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

      const isCorrect = this.checker.compare(outputResult.output, testcase.output);
      const tcStatus: TestcaseStatus = isCorrect ? 'ACCEPTED' : 'WRONG_ANSWER';

      const { time, memory } = outputResult;

      await this.publishUpdate(i, tcStatus, time, memory);
      this.updateStatistics(tcStatus, time, memory);

      this.lastProcessedIndex = i;
    }
  }

  isAllCompleted(): boolean {
    return this.lastProcessedIndex === this.testcases.length - 1;
  }

  async reportFinalResult(): Promise<void> {
    await this.pubsub.publishFinalResult({
      type: 'FINAL_RESULT',
      submissionId: this.submissionId,
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

  private async publishUpdate(index: number, status: TestcaseStatus, time: number, memory: number) {
    await this.pubsub.publishTestcaseUpdate({
      type: 'TESTCASE_UPDATE',
      submissionId: this.submissionId,
      testcase: { index: index + 1, status, time, memory },
      progress: {
        completed: index + 1,
        passed: status === 'ACCEPTED' ? this.passed + 1 : this.passed,
        total: this.testcases.length,
      },
    });
  }

  private updateStatistics(status: TestcaseStatus, time: number, memory: number) {
    this.maxTime = Math.max(this.maxTime, time);
    this.maxMemory = Math.max(this.maxMemory, memory);
    if (status === 'ACCEPTED') {
      this.passed++;
    } else {
      this.finalStatus = status; // 하나라도 틀리면 최종 상태 업데이트
    }
  }
}
