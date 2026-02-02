import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import RedisMock from 'ioredis-mock';

import { Battle as BattleEntity } from '@/battle/battle.entity';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { MatchingService } from '@/matching/matching.service';
import { ProblemService } from '@/problem/problem.service';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { RoomService } from '@/room/room.service';
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';
import { UserService } from '@/user/user.service';

describe('BattleService', () => {
  let service: BattleService;
  let mockBattleRepository: any;
  let mockSubmissionRepository: any;
  let mockUserRepository: any;
  let redis: RedisMock;

  beforeEach(async () => {
    redis = new RedisMock();

    mockBattleRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    // submission repository mock 설정
    mockSubmissionRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        whereInIds: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    // user repository mock 설정
    mockUserRepository = {
      createQueryBuilder: jest.fn(() => ({
        whereInIds: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        {
          provide: getRepositoryToken(BattleEntity),
          useValue: mockBattleRepository,
        },
        {
          provide: getRepositoryToken(Submission),
          useValue: mockSubmissionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redis,
        },
        {
          provide: BattleRedisService,
          useValue: {
            getBattle: jest.fn(),
            getBattleIdByRoomId: jest.fn(),
            deleteBattle: jest.fn(),
            createBattle: jest.fn(),
            updateBattle: jest.fn(),
          },
        },
        {
          provide: ProblemService,
          useValue: {
            findOne: jest.fn(),
            findFirst: jest.fn(),
          },
        },
        {
          provide: MatchingService,
          useValue: {
            clearUserMatchingStatus: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UserService,
          useValue: {
            updateRatings: jest.fn().mockResolvedValue({
              winner: { ratingDelta: 10 },
              loser: { ratingDelta: -10 },
            }),
          },
        },
        {
          provide: RoomService,
          useValue: {
            deleteRoom: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<BattleService>(BattleService);
  });

  it('배틀 결과를 정상적으로 조회해야 한다', async () => {
    const battleStartTime = new Date('2024-01-01T10:00:00Z');
    const mockBattle = {
      id: 'battle-123',
      winnerId: 'user-1',
      winnerSubmissionId: 'sub-1',
      loserSubmissionId: 'sub-2',
      playerIds: ['user-1', 'user-2'],
      startedAt: battleStartTime,
    };

    const mockSubmissions = [
      {
        userId: 'user-1',
        code: 'console.log("winner")',
        passedTestCases: 20,
        totalTestCases: 20,
        createdAt: new Date('2024-01-01T10:05:00Z'),
      },
      {
        userId: 'user-2',
        code: 'console.log("loser")',
        passedTestCases: 15,
        totalTestCases: 20,
        createdAt: new Date('2024-01-01T10:08:00Z'),
      },
    ];

    const mockUsers = [
      {
        id: 'user-1',
        username: 'Winner',
        avatarUrl: 'http://avatar1.com',
        tier: { tier: 'Gold', division: 3 },
        rating: 1500,
      },
      {
        id: 'user-2',
        username: 'Loser',
        avatarUrl: 'http://avatar2.com',
        tier: { tier: 'Silver', division: 2 },
        rating: 1200,
      },
    ];

    mockBattleRepository.findOne.mockResolvedValue(mockBattle);

    // createQueryBuilder의 getMany mock 재설정
    const submissionQueryBuilder = {
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockSubmissions),
    };
    mockSubmissionRepository.createQueryBuilder.mockReturnValue(submissionQueryBuilder);

    const userQueryBuilder = {
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockUsers),
    };
    mockUserRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);

    const result = await service.getBattleResult('battle-123');

    expect(result.battle.winnerId).toBe('user-1');
    expect(result.players).toHaveLength(2);

    const winner = result.players.find((p: any) => p.userId === 'user-1');
    expect(winner!.username).toBe('Winner');
    expect(winner!.score).toBe(20);
    expect(winner!.time).toBe('5:00');
  });

  it('제출하지 않은 참가자도 결과에 포함되어야 한다', async () => {
    const mockBattle = {
      id: 'battle-456',
      winnerId: 'user-1',
      winnerSubmissionId: 'sub-1',
      loserSubmissionId: null,
      playerIds: ['user-1', 'user-2'],
      startedAt: new Date('2024-01-01T10:00:00Z'),
    };

    const mockSubmissions = [
      {
        userId: 'user-1',
        code: 'console.log("test")',
        passedTestCases: 20,
        totalTestCases: 20,
        createdAt: new Date('2024-01-01T10:05:00Z'),
      },
    ];

    const mockUsers = [
      {
        id: 'user-1',
        username: 'Winner',
        avatarUrl: 'http://avatar.com',
        tier: { tier: 'Gold', division: 1 },
        rating: 1500,
      },
      {
        id: 'user-2',
        username: 'NoSubmit',
        avatarUrl: 'http://avatar2.com',
        tier: { tier: 'Bronze', division: 4 },
        rating: 1000,
      },
    ];

    mockBattleRepository.findOne.mockResolvedValue(mockBattle);

    // createQueryBuilder의 getMany mock 재설정
    const submissionQueryBuilder = {
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockSubmissions),
    };
    mockSubmissionRepository.createQueryBuilder.mockReturnValue(submissionQueryBuilder);

    const userQueryBuilder = {
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockUsers),
    };
    mockUserRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);

    const result = await service.getBattleResult('battle-456');

    expect(result.players).toHaveLength(2);

    const noSubmitUser = result.players.find((p: any) => p.userId === 'user-2');
    expect(noSubmitUser!.score).toBe(0);
    expect(noSubmitUser!.time).toBe('-');
    expect(noSubmitUser!.code).toBe('');
  });

  it('배틀이 존재하지 않으면 에러를 던져야 한다', async () => {
    mockBattleRepository.findOne.mockResolvedValue(null);

    await expect(service.getBattleResult('non-existent')).rejects.toThrow(
      '배틀 정보를 찾을 수 없습니다.',
    );
  });

  describe('배틀 정리 로직', () => {
    it('deleteBattle 호출 시 battleRedisService.deleteBattle이 호출되어야 한다', async () => {
      const roomId = 'room-123';
      const battleId = 'battle-456';

      const battleRedisService = (service as any).battleRedisService;
      battleRedisService.getBattleIdByRoomId = jest.fn().mockResolvedValue(battleId);
      battleRedisService.deleteBattle = jest.fn().mockResolvedValue(undefined);

      await service.deleteBattle(roomId);

      expect(battleRedisService.deleteBattle).toHaveBeenCalledWith(battleId, roomId);
    });

    it('endBattle 호출 시 battleRedisService.deleteBattle이 호출되어야 한다', async () => {
      const battleId = 'battle-123';
      const roomId = 'room-123';
      const mockBattleData = {
        battleId,
        roomId,
        users: [{ userId: 'u1' }, { userId: 'u2' }],
        startedAt: new Date().toISOString(),
      };

      const battleRedisService = (service as any).battleRedisService;
      battleRedisService.getBattle = jest.fn().mockResolvedValue(mockBattleData);
      battleRedisService.deleteBattle = jest.fn().mockResolvedValue(undefined);

      // set(NX) 모킹 - 첫 번째만 성공
      let callCount = 0;
      (service as any).redisClient.set = jest.fn().mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return Promise.resolve('OK');
        }
        return Promise.resolve(null);
      });
      (service as any).redisClient.srem = jest.fn().mockResolvedValue(1);

      await service.endBattle(battleId);

      expect(battleRedisService.deleteBattle).toHaveBeenCalledWith(battleId, roomId);
    });

    it('endBattle이 동시에 여러 번 호출되어도 DB 저장은 한 번만 발생해야 한다', async () => {
      const battleId = 'battle-concurrent-123';
      const roomId = 'room-concurrent-123';
      const mockBattleData = {
        battleId,
        roomId,
        users: [{ userId: 'u1' }, { userId: 'u2' }],
        startedAt: new Date().toISOString(),
      };

      const battleRedisService = (service as any).battleRedisService;
      battleRedisService.getBattle = jest.fn().mockResolvedValue(mockBattleData);
      battleRedisService.deleteBattle = jest.fn().mockResolvedValue(undefined);

      // redis.set(..., 'NX') 모킹: 첫 호출만 성공(OK), 이후 실패(null)
      let lockAcquired = false;
      (service as any).redisClient.set = jest.fn().mockImplementation((key, val, ex, ttl, nx) => {
        if (nx === 'NX' && !lockAcquired) {
          lockAcquired = true;
          return Promise.resolve('OK');
        }
        return Promise.resolve(null);
      });
      (service as any).redisClient.srem = jest.fn().mockResolvedValue(1);

      // 동시에 5번 호출
      const results = await Promise.allSettled([
        service.endBattle(battleId),
        service.endBattle(battleId),
        service.endBattle(battleId),
        service.endBattle(battleId),
        service.endBattle(battleId),
      ]);

      // 성공한 것이 최소 하나여야 함 (이미 저장되었으면 findOne 결과 리턴하므로 모두 성공할 수도 있음)
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      // 하지만 핵심 로직(Redis 데이터 삭제)은 한 번만 실행되어야 함
      expect(battleRedisService.getBattle).toHaveBeenCalledTimes(1);
      expect(battleRedisService.deleteBattle).toHaveBeenCalledTimes(1);
      expect(mockBattleRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
