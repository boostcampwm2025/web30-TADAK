/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Battle } from '@/battle/battle.entity';
import { Problem } from '@/problem/problem.entity';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';
import { UserService } from '@/user/user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: any;
  let battleRepository: any;
  let submissionRepository: any;
  let problemRepository: any;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    battleRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    submissionRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    problemRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Battle), useValue: battleRepository },
        { provide: getRepositoryToken(Submission), useValue: submissionRepository },
        { provide: getRepositoryToken(Problem), useValue: problemRepository },
        { provide: REDIS_CLIENT, useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('getBattleHistory', () => {
    it('사용자의 배틀 기록 목록을 정상적으로 반환해야 한다', async () => {
      const userId = 'user-1';
      const mockBattles = [
        {
          id: 'battle-1',
          playerIds: ['user-1', 'user-2'],
          winnerId: 'user-1',
          problemId: 'prob-1',
          player1RatingChange: 15,
          player2RatingChange: -15,
          createdAt: new Date(),
        },
      ];

      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBattles),
      };

      battleRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepository.findOne.mockResolvedValue({ username: 'Opponent' });
      problemRepository.findOne.mockResolvedValue({
        title: 'Problem Title',
        difficulty: 'Gold',
        testcases: [{}, {}, {}],
      });
      submissionRepository.findOne.mockResolvedValue({
        language: 'typescript',
        passedTestCases: 3,
        totalTestCases: 3,
      });

      const result = await service.getBattleHistory(userId);

      expect(result).toHaveLength(1);
      expect(result[0].result).toBe('WIN');
      expect(result[0].opponentName).toBe('Opponent');
      expect(result[0].problem.title).toBe('Problem Title');
      expect(result[0].ratingChange).toBe(15);
      expect(result[0].submission?.passedTestCases).toBe(3);
    });

    it('배틀 결과가 무승부일 경우 DRAW로 반환해야 한다', async () => {
      const userId = 'user-1';
      const mockBattles = [
        {
          id: 'battle-2',
          playerIds: ['user-1', 'user-2'],
          winnerId: null,
          problemId: 'prob-1',
          player1RatingChange: 0,
          createdAt: new Date(),
        },
      ];

      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBattles),
      };

      battleRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      userRepository.findOne.mockResolvedValue({ username: 'Opponent' });
      problemRepository.findOne.mockResolvedValue({ title: 'Title' });
      submissionRepository.findOne.mockResolvedValue(null);

      const result = await service.getBattleHistory(userId);

      expect(result[0].result).toBe('DRAW');
      expect(result[0].submission).toBeNull();
    });
  });
});
