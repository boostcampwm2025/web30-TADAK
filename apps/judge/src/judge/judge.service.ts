import { Injectable, Logger } from '@nestjs/common';

import { PubsubService } from '../pubsub/pubsub.service';
import { JudgeChecker } from './judge.checker';
import { JudgeContext } from './judge.context';
import { JudgePoller } from './judge.poller';
import { JudgeReader } from './judge.reader';

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);

  constructor(
    private readonly reader: JudgeReader,
    private readonly checker: JudgeChecker,
    private readonly poller: JudgePoller,
    private readonly pubsub: PubsubService,
  ) {}

  // 전체 채점 흐름 관리
  async judgeSubmission(submissionId: string): Promise<void> {
    try {
      const metadata = this.reader.readMetadata(submissionId);
      const testcases = this.reader.loadTestcases(metadata.problemId, metadata.type);

      const context = new JudgeContext(
        submissionId,
        metadata.socketId,
        testcases,
        this.reader,
        this.checker,
        this.pubsub,
      );

      await this.poller.poll(
        () => context.hasNewOutput(),
        () => context.process(),
        () => context.isAllCompleted(),
      );

      await context.reportFinalResult();

      const { passed, total } = context.getSummary();
      this.logger.log(`채점 완료: Submission ${submissionId} - (${passed}/${total} TC)`);
    } catch (error) {
      this.logger.error(`Failed to judge submission ${submissionId}`, error);
      throw error;
    }
  }
}
