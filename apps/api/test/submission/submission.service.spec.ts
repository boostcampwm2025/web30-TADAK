import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Problem } from '@/problem/problem.entity';
import { Submission } from '@/submission/submission.entity';
import { SubmissionService } from '@/submission/submission.service';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let submissionRepository: any;
  let problemRepository: any;

  beforeEach(async () => {
    submissionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    problemRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: getRepositoryToken(Submission),
          useValue: submissionRepository,
        },
        {
          provide: getRepositoryToken(Problem),
          useValue: problemRepository,
        },
        {
          provide: getQueueToken('submission-queue'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
  });

  describe('getSubmissionDetail', () => {
    it('제출 상세 정보를 정상적으로 반환해야 한다', async () => {
      const submissionId = 'sub-1';
      const userId = 'user-1';
      const mockSubmission = {
        id: submissionId,
        userId: userId,
        problemId: 'prob-1',
        code: 'console.log("hello")',
        language: 'javascript',
      };
      const mockProblem = {
        id: 'prob-1',
        title: 'Problem Title',
        source: 'Source',
        difficulty: 'Bronze',
        tags: ['tag1'],
        timeLimit: 1,
        memoryLimit: 256,
        statement: 'Statement',
        input: 'Input',
        output: 'Output',
        note: 'Note',
        examples: [{ input: 'ex-in', output: 'ex-out' }],
      };

      submissionRepository.findOne.mockResolvedValue(mockSubmission);
      problemRepository.findOne.mockResolvedValue(mockProblem);

      const result = await service.getSubmissionDetail(submissionId, userId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(submissionId);
      expect(result?.code).toBe(mockSubmission.code);
      expect(result?.problem.title).toBe(mockProblem.title);
      expect(submissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: submissionId, userId },
      });
    });

    it('본인의 제출 기록이 아니면 null을 반환해야 한다', async () => {
      const submissionId = 'sub-1';
      const userId = 'other-user';

      submissionRepository.findOne.mockResolvedValue(null);

      const result = await service.getSubmissionDetail(submissionId, userId);

      expect(result).toBeNull();
    });

    it('연관된 문제 정보가 없으면 null을 반환해야 한다', async () => {
      const submissionId = 'sub-1';
      const userId = 'user-1';
      const mockSubmission = {
        id: submissionId,
        userId: userId,
        problemId: 'prob-not-found',
      };

      submissionRepository.findOne.mockResolvedValue(mockSubmission);
      problemRepository.findOne.mockResolvedValue(null);

      const result = await service.getSubmissionDetail(submissionId, userId);

      expect(result).toBeNull();
    });
  });
});
