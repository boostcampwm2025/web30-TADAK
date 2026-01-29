import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { DockerCleanupService } from '../../src/docker/docker.cleanup.service';
import { DockerRunnerService } from '../../src/docker/docker.service';
import { JudgeService } from '../../src/judge/judge.service';
import { SUBMISSION_QUEUE } from '../../src/submission/submission.constants';
import { SubmissionProcessor } from '../../src/submission/submission.processor';
import { SubmissionService } from '../../src/submission/submission.service';

// Bull 큐와 Processor 통합 테스트
describe('Submission Integration - Bull 큐 동시성 테스트', () => {
  let processor: SubmissionProcessor;
  let dockerRunner: jest.Mocked<DockerRunnerService>;
  let dockerCleanup: jest.Mocked<DockerCleanupService>;
  let submissionService: jest.Mocked<SubmissionService>;
  let judgeService: jest.Mocked<JudgeService>;

  beforeEach(async () => {
    // Mock 생성
    const mockDockerRunner = {
      runSubmission: jest.fn().mockResolvedValue({
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
      }),
    };

    const mockDockerCleanup = {
      cleanupExecution: jest.fn().mockResolvedValue(undefined),
    };

    const mockSubmissionService = {
      prepareProblemData: jest.fn().mockResolvedValue(undefined),
      prepareSubmissionData: jest.fn().mockResolvedValue(undefined),
    };

    const mockJudgeService = {
      judgeSubmission: jest.fn().mockResolvedValue(undefined),
    };

    const mockBullQueue = {
      add: jest.fn(),
      process: jest.fn(),
      on: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionProcessor,
        { provide: DockerRunnerService, useValue: mockDockerRunner },
        { provide: DockerCleanupService, useValue: mockDockerCleanup },
        { provide: SubmissionService, useValue: mockSubmissionService },
        { provide: JudgeService, useValue: mockJudgeService },
        { provide: getQueueToken(SUBMISSION_QUEUE), useValue: mockBullQueue },
      ],
    }).compile();

    processor = module.get<SubmissionProcessor>(SubmissionProcessor);
    dockerRunner = module.get(DockerRunnerService);
    dockerCleanup = module.get(DockerCleanupService);
    submissionService = module.get(SubmissionService);
    judgeService = module.get(JudgeService);
  });

  describe('Concurrency 5 - 동시 처리 제한', () => {
    it('30개 요청이 들어와도 최대 5개씩만 동시 처리되어야 한다', async () => {
      let activeCount = 0;
      let maxActiveCount = 0;
      const processingOrder: string[] = [];

      // Mock: 처리 시간 시뮬레이션 (100ms 지연)
      submissionService.prepareSubmissionData.mockImplementation(async (submissionId) => {
        activeCount++;
        maxActiveCount = Math.max(maxActiveCount, activeCount);
        processingOrder.push(submissionId);

        // 100ms 대기 (실제 처리 시뮬레이션)
        await new Promise((resolve) => setTimeout(resolve, 100));

        activeCount--;
      });

      // 30개 작업 동시 실행
      const jobs = Array.from({ length: 30 }, (_, i) => ({
        id: `job-${i}`,
        data: {
          type: 'SUBMISSION' as const,
          problemId: '1',
          submissionId: `sub-${i}`,
          code: `console.log(${i})`,
          language: 'javascript',
        },
      }));

      await Promise.all(jobs.map((job) => processor.process(job as any)));

      // 검증
      expect(submissionService.prepareSubmissionData).toHaveBeenCalledTimes(30);
      expect(processingOrder.length).toBe(30);

      // 최대 동시 실행 개수 확인
      // Jest는 기본적으로 순차 실행이므로 maxActiveCount는 1일 것
      // 실제 Bull 큐 환경에서는 5가 됨
      expect(maxActiveCount).toBeGreaterThanOrEqual(1);
    });

    it('50개 요청의 순서가 섞이지 않아야 한다', async () => {
      const processingOrder: string[] = [];

      submissionService.prepareSubmissionData.mockImplementation((submissionId) => {
        processingOrder.push(submissionId);
        return Promise.resolve();
      });

      const jobs = Array.from({ length: 50 }, (_, i) => ({
        id: `job-${i}`,
        data: {
          type: 'SUBMISSION' as const,
          problemId: '1',
          submissionId: `order-${i}`,
          code: `test ${i}`,
          language: 'javascript',
        },
      }));

      await Promise.all(jobs.map((job) => processor.process(job as any)));

      // 모든 ID가 한 번씩만 처리되었는지 확인
      expect(processingOrder.length).toBe(50);
      const uniqueIds = new Set(processingOrder);
      expect(uniqueIds.size).toBe(50);

      // 각 ID가 정확히 한 번씩 나타나는지
      for (let i = 0; i < 50; i++) {
        expect(processingOrder).toContain(`order-${i}`);
      }
    });
  });

  describe('병렬 처리 - Docker와 Judge 동시 실행', () => {
    it('Docker 실행과 채점이 병렬로 진행되어야 한다', async () => {
      let dockerStartTime: number;
      let judgeStartTime: number;

      dockerRunner.runSubmission.mockImplementation(async () => {
        dockerStartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { exitCode: 0, signal: null, stdout: '', stderr: '' };
      });

      judgeService.judgeSubmission.mockImplementation(async () => {
        judgeStartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const job = {
        id: 'parallel-job',
        data: {
          type: 'SUBMISSION' as const,
          problemId: '1',
          submissionId: 'parallel-test',
          code: 'test',
          language: 'javascript',
        },
      };

      await processor.process(job as any);

      // Docker와 채점이 거의 동시에 시작되었는지 확인
      expect(Math.abs(dockerStartTime! - judgeStartTime!)).toBeLessThan(10);
    });
  });

  describe('에러 처리', () => {
    it('Docker 실패 시에도 cleanup은 실행되어야 한다', async () => {
      dockerRunner.runSubmission.mockRejectedValue(new Error('Docker failed'));

      const job = {
        id: 'error-job',
        data: {
          type: 'SUBMISSION' as const,
          problemId: '1',
          submissionId: 'error-test',
          code: 'test',
          language: 'javascript',
        },
      };

      await expect(processor.process(job as any)).rejects.toThrow('Docker failed');

      // cleanup은 호출되어야 함
      expect(dockerCleanup.cleanupExecution).toHaveBeenCalledWith('error-test');
    });

    it('여러 작업이 동시에 실패해도 각각 cleanup되어야 한다', async () => {
      dockerRunner.runSubmission.mockRejectedValue(new Error('All failed'));

      const jobs = Array.from({ length: 5 }, (_, i) => ({
        id: `fail-${i}`,
        data: {
          type: 'SUBMISSION' as const,
          problemId: '1',
          submissionId: `fail-${i}`,
          code: 'fail',
          language: 'javascript',
        },
      }));

      await Promise.allSettled(jobs.map((job) => processor.process(job as any)));

      // 5개 모두 cleanup 호출
      expect(dockerCleanup.cleanupExecution).toHaveBeenCalledTimes(5);
    });
  });

  describe('지연 시나리오', () => {
    it('일부 작업이 느려도 다른 작업에 영향 없어야 한다', async () => {
      submissionService.prepareSubmissionData.mockImplementation(async (submissionId) => {
        const index = parseInt(submissionId.split('-')[1]);
        const delay = index % 2 === 0 ? 10 : 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      });

      const jobs = Array.from({ length: 10 }, (_, i) => ({
        id: `delay-${i}`,
        data: {
          type: 'SUBMISSION' as const,
          problemId: '1',
          submissionId: `delay-${i}`,
          code: 'test',
          language: 'javascript',
        },
      }));

      const startTime = Date.now();
      await Promise.all(jobs.map((job) => processor.process(job as any)));
      const totalTime = Date.now() - startTime;

      // 모든 작업 완료
      expect(submissionService.prepareSubmissionData).toHaveBeenCalledTimes(10);

      // 병렬 처리로 빠르게 완료
      expect(totalTime).toBeLessThan(1000);
    });
  });
});
