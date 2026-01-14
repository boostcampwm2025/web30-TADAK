import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { DockerRunnerService } from '../docker/docker.service';
import { SUBMISSION_QUEUE, SUBMISSION_WORKER_CONCURRENCY } from './submission.constants';
import { parseSubmissionJobPayload, SubmissionJobPayload } from './submission.payload';

@Processor(SUBMISSION_QUEUE, { concurrency: SUBMISSION_WORKER_CONCURRENCY })
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(private readonly dockerRunnerService: DockerRunnerService) {
    super();
  }

  async process(job: Job<SubmissionJobPayload>): Promise<void> {
    const payload = parseSubmissionJobPayload(job.data);
    // 컨테이너 실행에 사용할 실행 ID 결정
    const executionId =
      payload.submissionId !== null
        ? String(payload.submissionId)
        : job.id !== undefined && job.id !== null
          ? String(job.id)
          : null;

    if (!executionId) {
      throw new Error('Execution id is required to run docker container.');
    }

    this.logger.log(
      `Job ${job.id ?? 'unknown'} received: type=${payload.type}, problemId=${payload.problemId}, submissionId=${payload.submissionId ?? 'null'}`,
    );

    const result = await this.dockerRunnerService.runSubmission({ submissionId: executionId });

    this.logger.log(
      `Docker run completed: exitCode=${result.exitCode ?? 'null'}, signal=${result.signal ?? 'null'}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SubmissionJobPayload> | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
  }
}
