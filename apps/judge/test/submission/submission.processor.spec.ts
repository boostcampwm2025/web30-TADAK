/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';

import { DockerCleanupService } from '../../src/docker/docker.cleanup.service';
import { DockerRunnerService } from '../../src/docker/docker.service';
import { JudgeService } from '../../src/judge/judge.service';
import { SubmissionProcessor } from '../../src/submission/submission.processor';
import { SubmissionService } from '../../src/submission/submission.service';

describe('SubmissionProcessor - Bull 큐 작업 처리', () => {
  let processor: SubmissionProcessor;
  let dockerRunner: jest.Mocked<DockerRunnerService>;
  let dockerCleanup: jest.Mocked<DockerCleanupService>;
  let submissionService: jest.Mocked<SubmissionService>;
  let judgeService: jest.Mocked<JudgeService>;

  beforeEach(async () => {
    const mockDockerRunner = {
      runSubmission: jest.fn(),
    };

    const mockDockerCleanup = {
      cleanupExecution: jest.fn(),
    };

    const mockSubmissionService = {
      prepareProblemData: jest.fn(),
      prepareSubmissionData: jest.fn(),
    };

    const mockJudgeService = {
      judgeSubmission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionProcessor,
        { provide: DockerRunnerService, useValue: mockDockerRunner },
        { provide: DockerCleanupService, useValue: mockDockerCleanup },
        { provide: SubmissionService, useValue: mockSubmissionService },
        { provide: JudgeService, useValue: mockJudgeService },
      ],
    }).compile();

    module.useLogger(false);

    processor = module.get<SubmissionProcessor>(SubmissionProcessor);
    dockerRunner = module.get(DockerRunnerService);
    dockerCleanup = module.get(DockerCleanupService);
    submissionService = module.get(SubmissionService);
    judgeService = module.get(JudgeService);
  });

  describe('process', () => {
    it('제출 작업을 정상적으로 처리해야 한다', async () => {
      const job = {
        id: '123',
        data: {
          type: 'SUBMISSION',
          problemId: '1',
          submissionId: '456',
          code: 'console.log("hello")',
          language: 'javascript',
        },
      } as Job;

      submissionService.prepareProblemData.mockResolvedValue(undefined);
      submissionService.prepareSubmissionData.mockResolvedValue(undefined);
      dockerRunner.runSubmission.mockResolvedValue({
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
      });
      judgeService.judgeSubmission.mockResolvedValue(undefined);
      dockerCleanup.cleanupExecution.mockResolvedValue(undefined);

      await processor.process(job);

      expect(submissionService.prepareProblemData).toHaveBeenCalledWith('1');
      expect(submissionService.prepareSubmissionData).toHaveBeenCalledWith(
        '456',
        'SUBMISSION',
        '1',
        'console.log("hello")',
        undefined,
        undefined,
      );
      expect(dockerRunner.runSubmission).toHaveBeenCalledWith({ submissionId: '456' });
      expect(judgeService.judgeSubmission).toHaveBeenCalledWith('456');
      expect(dockerCleanup.cleanupExecution).toHaveBeenCalledWith('456');
    });

    it('TEST 타입 작업을 처리해야 한다', async () => {
      const job = {
        id: '124',
        data: {
          type: 'TEST',
          problemId: '2',
          submissionId: '789',
          code: 'const x = 1;',
          language: 'javascript',
          socketId: 'socket-123',
        },
      } as Job;

      submissionService.prepareProblemData.mockResolvedValue(undefined);
      submissionService.prepareSubmissionData.mockResolvedValue(undefined);
      dockerRunner.runSubmission.mockResolvedValue({
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
      });
      judgeService.judgeSubmission.mockResolvedValue(undefined);
      dockerCleanup.cleanupExecution.mockResolvedValue(undefined);

      await processor.process(job);

      expect(submissionService.prepareSubmissionData).toHaveBeenCalledWith(
        '789',
        'TEST',
        '2',
        'const x = 1;',
        'socket-123',
        undefined,
      );
    });

    it('Docker와 채점을 병렬로 실행해야 한다', async () => {
      const job = {
        id: '125',
        data: {
          type: 'SUBMISSION',
          problemId: '3',
          submissionId: '111',
          code: 'test code',
          language: 'javascript',
        },
      } as Job;

      let dockerStartTime: number;
      let judgeStartTime: number;
      let dockerEndTime: number;
      let judgeEndTime: number;

      submissionService.prepareProblemData.mockResolvedValue(undefined);
      submissionService.prepareSubmissionData.mockResolvedValue(undefined);
      dockerCleanup.cleanupExecution.mockResolvedValue(undefined);

      dockerRunner.runSubmission.mockImplementation(async () => {
        dockerStartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        dockerEndTime = Date.now();
        return { exitCode: 0, signal: null, stdout: '', stderr: '' };
      });

      judgeService.judgeSubmission.mockImplementation(async () => {
        judgeStartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        judgeEndTime = Date.now();
      });

      await processor.process(job);

      expect(Math.abs(dockerStartTime! - judgeStartTime!)).toBeLessThan(10);
      expect(dockerEndTime!).toBeGreaterThan(dockerStartTime!);
      expect(judgeEndTime!).toBeGreaterThan(judgeStartTime!);
    });

    it('에러 발생 시에도 cleanup을 실행해야 한다', async () => {
      const job = {
        id: '126',
        data: {
          type: 'SUBMISSION',
          problemId: '4',
          submissionId: '222',
          code: 'error code',
          language: 'javascript',
        },
      } as Job;

      submissionService.prepareProblemData.mockResolvedValue(undefined);
      submissionService.prepareSubmissionData.mockResolvedValue(undefined);
      dockerRunner.runSubmission.mockRejectedValue(new Error('Docker failed'));
      judgeService.judgeSubmission.mockResolvedValue(undefined);
      dockerCleanup.cleanupExecution.mockResolvedValue(undefined);

      await expect(processor.process(job)).rejects.toThrow('Docker failed');

      expect(dockerCleanup.cleanupExecution).toHaveBeenCalledWith('222');
    });

    it('채점 실패 시에도 cleanup을 실행해야 한다', async () => {
      const job = {
        id: '127',
        data: {
          type: 'SUBMISSION',
          problemId: '5',
          submissionId: '333',
          code: 'test',
          language: 'javascript',
        },
      } as Job;

      submissionService.prepareProblemData.mockResolvedValue(undefined);
      submissionService.prepareSubmissionData.mockResolvedValue(undefined);
      dockerRunner.runSubmission.mockResolvedValue({
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
      });
      judgeService.judgeSubmission.mockRejectedValue(new Error('Judge failed'));
      dockerCleanup.cleanupExecution.mockResolvedValue(undefined);

      await expect(processor.process(job)).rejects.toThrow('Judge failed');

      expect(dockerCleanup.cleanupExecution).toHaveBeenCalledWith('333');
    });

    it('battleId가 있는 경우 전달해야 한다', async () => {
      const job = {
        id: '128',
        data: {
          type: 'SUBMISSION',
          problemId: '6',
          submissionId: '444',
          code: 'battle code',
          language: 'javascript',
          battleId: '999',
        },
      } as Job;

      submissionService.prepareProblemData.mockResolvedValue(undefined);
      submissionService.prepareSubmissionData.mockResolvedValue(undefined);
      dockerRunner.runSubmission.mockResolvedValue({
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
      });
      judgeService.judgeSubmission.mockResolvedValue(undefined);
      dockerCleanup.cleanupExecution.mockResolvedValue(undefined);

      await processor.process(job);

      expect(submissionService.prepareSubmissionData).toHaveBeenCalledWith(
        '444',
        'SUBMISSION',
        '6',
        'battle code',
        undefined,
        '999',
      );
    });
  });

  describe('onFailed', () => {
    it('작업 실패 시 에러를 로깅해야 한다', () => {
      const job = {
        id: '999',
        data: {},
      } as Job;
      const error = new Error('Test error');

      expect(() => processor.onFailed(job, error)).not.toThrow();
    });

    it('job이 undefined인 경우에도 처리해야 한다', () => {
      const error = new Error('Unknown error');

      expect(() => processor.onFailed(undefined, error)).not.toThrow();
    });
  });
});
