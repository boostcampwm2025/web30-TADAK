import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { DockerCleanupService } from '../docker/docker.cleanup.service';
import { DockerRunnerService } from '../docker/docker.service';
import { JudgeService } from '../judge/judge.service';
import { SUBMISSION_QUEUE, SUBMISSION_WORKER_CONCURRENCY } from './submission.constants';
import { parseSubmissionJobPayload, SubmissionJobPayload } from './submission.payload';
import { SubmissionService } from './submission.service';

@Processor(SUBMISSION_QUEUE, { concurrency: SUBMISSION_WORKER_CONCURRENCY })
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(
    private readonly dockerRunnerService: DockerRunnerService,
    private readonly dockerCleanupService: DockerCleanupService,
    private readonly submissionService: SubmissionService,
    private readonly judgeService: JudgeService,
  ) {
    super();
  }

  async process(job: Job<SubmissionJobPayload>): Promise<void> {
    const payload = parseSubmissionJobPayload(job.data);
    // 컨테이너 실행에 사용할 실행 ID 결정
    const executionId = String(payload.submissionId);

    this.logger.log(
      `Job ${job.id ?? 'unknown'} received: type=${payload.type}, problemId=${payload.problemId}, submissionId=${payload.submissionId ?? 'null'}`,
    );

    try {
      // 문제 데이터 준비
      await this.submissionService.prepareProblemData(payload.problemId);

      // 제출 데이터 준비
      await this.submissionService.prepareSubmissionData(
        executionId,
        payload.type,
        payload.problemId,
        payload.code,
        payload.socketId,
        payload.battleId,
      );

      // Docker 실행과 채점을 병렬로 시작
      const [result] = await Promise.all([
        this.dockerRunnerService.runSubmission({ submissionId: executionId }),
        this.judgeService.judgeSubmission(executionId),
      ]);

      this.logger.log(
        `Docker run completed: exitCode=${result.exitCode ?? 'null'}, signal=${result.signal ?? 'null'}`,
      );
    } finally {
      await this.dockerCleanupService.cleanupExecution(executionId);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SubmissionJobPayload> | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
  }
}
