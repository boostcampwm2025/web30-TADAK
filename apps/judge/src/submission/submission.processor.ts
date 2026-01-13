import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { SUBMISSION_QUEUE, SUBMISSION_WORKER_CONCURRENCY } from './submission.constants';
import { parseSubmissionJobPayload, SubmissionJobPayload } from './submission.payload';

@Processor(SUBMISSION_QUEUE, { concurrency: SUBMISSION_WORKER_CONCURRENCY })
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  async process(job: Job<SubmissionJobPayload>): Promise<void> {
    const payload = parseSubmissionJobPayload(job.data);

    this.logger.log(
      `Job ${job.id ?? 'unknown'} received: type=${payload.type}, problemId=${payload.problemId}, submissionId=${payload.submissionId ?? 'null'}`,
    );

    // TODO: 연결된 채점 로직(Docker 실행 등)으로 payload 전달
    await Promise.resolve();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SubmissionJobPayload> | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
  }
}
