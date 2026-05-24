import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { DockerCleanupService } from '../docker/docker.cleanup.service';
import { DockerRunnerService } from '../docker/docker.service';
import { JudgeCacheService } from '../judge/judge.cache.service';
import { JudgeService } from '../judge/judge.service';
import { PubsubService } from '../pubsub/pubsub.service';
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
    private readonly judgeCacheService: JudgeCacheService,
    private readonly pubsubService: PubsubService,
  ) {
    super();
  }

  async process(job: Job<SubmissionJobPayload>): Promise<void> {
    const payload = parseSubmissionJobPayload(job.data);
    const executionId = String(payload.submissionId);

    this.logger.log(
      `Job ${job.id ?? 'unknown'} received: type=${payload.type}, problemId=${payload.problemId}, submissionId=${payload.submissionId ?? 'null'}`,
    );

    const startTime = performance.now();

    try {
      // 1. 캐시 확인
      const cacheKey = this.judgeCacheService.generateKey(
        payload.problemId,
        payload.type,
        payload.code,
      );
      const cachedResult = await this.judgeCacheService.get(cacheKey);

      if (cachedResult) {
        this.logger.log(`Cache Hit! submissionId=${executionId}`);
        // 캐시된 결과 "Replay" (사용자에게 실시간 결과 전달 모사)
        let currentPassed = 0;
        for (const tc of cachedResult.testcases) {
          if (tc.status === 'ACCEPTED') currentPassed++;
          await this.pubsubService.publishTestcaseUpdate({
            type: 'TESTCASE_UPDATE',
            submissionId: executionId,
            socketId: payload.socketId,
            testcase: { index: tc.index, status: tc.status, time: tc.time, memory: tc.memory },
            progress: {
              completed: tc.index,
              passed: currentPassed,
              total: cachedResult.total,
            },
            results: tc.results,
          });
        }

        await this.pubsubService.publishFinalResult({
          type: 'FINAL_RESULT',
          submissionId: executionId,
          socketId: payload.socketId,
          status: cachedResult.status,
          result: {
            passed: cachedResult.passed,
            total: cachedResult.total,
            time: cachedResult.time,
            memory: cachedResult.memory,
          },
        });

        const endTime = performance.now();
        this.logger.log(`[PERF] Cache Hit Processing Time: ${(endTime - startTime).toFixed(2)}ms`);
        return;
      }

      this.logger.log(`Cache Miss. Running full judging... submissionId=${executionId}`);

      // 2. 문제 및 제출 데이터 준비
      await this.submissionService.prepareProblemData(payload.problemId);
      await this.submissionService.prepareSubmissionData(
        executionId,
        payload.type,
        payload.problemId,
        payload.code,
        payload.language,
        payload.socketId,
        payload.battleId,
      );

      // 3. Docker 실행과 채점을 병렬로 시작
      const [dockerResult, judgeResult] = await Promise.all([
        this.dockerRunnerService.runSubmission({
          submissionId: executionId,
          language: payload.language,
        }),
        this.judgeService.judgeSubmission(executionId),
      ]);

      // 4. 결과 캐싱
      if (judgeResult) {
        await this.judgeCacheService.set(cacheKey, judgeResult);
      }

      const endTime = performance.now();
      this.logger.log(
        `[PERF] Cache Miss Processing Time: ${(endTime - startTime).toFixed(2)}ms (Docker Exit: ${dockerResult.exitCode})`,
      );
    } finally {
      await this.dockerCleanupService.cleanupExecution(executionId);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SubmissionJobPayload> | undefined, error: Error): void {
    const jobId = job?.id ?? 'unknown';
    const attempts = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    this.logger.error(
      `Job ${jobId} failed (attempt ${attempts}/${maxAttempts}): ${error.message}`,
      error.stack,
    );

    // 모든 재시도 소진 시 UI에 ERROR 알림 → 버튼 활성화
    if (job && attempts >= maxAttempts) {
      const payload = job.data;
      this.pubsubService
        .publishFinalResult({
          type: 'FINAL_RESULT',
          submissionId: String(payload.submissionId),
          socketId: payload.socketId,
          status: 'INTERNAL_ERROR',
          result: { passed: 0, total: 0, time: 0, memory: 0 },
        })
        .catch((publishError: Error) => {
          this.logger.error(
            `Failed to publish FINAL_RESULT for job ${jobId}: ${publishError.message}`,
            publishError.stack,
          );
        });
    }
  }
}
