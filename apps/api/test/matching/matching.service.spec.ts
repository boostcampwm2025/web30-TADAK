/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { MATCHING_CONFIG } from '@packages/constants/matching';
import { MatchingUser } from '@packages/types/matching';

import { MatchingGateway } from '../../src/matching/matching.gateway';
import { MatchingService } from '../../src/matching/matching.service';
import { REDIS_CLIENT } from '../../src/redis/redis.module';
import { RedisKeys } from '../../src/redis/redis-key.constant';
import { RoomService } from '../../src/room/room.service';

describe('MatchingService', () => {
  let service: MatchingService;
  let mockRedis: any;
  let mockRoomService: any;
  let mockMatchingGateway: any;
  let pipelineMock: any;

  const createMockUser = (
    userId: string,
    rating: number,
    waitingSince: Date = new Date(),
  ): MatchingUser => ({
    userId,
    username: `User${userId}`,
    rating,
    tier: { tier: 'GOLD', division: 3 },
    status: 'WAITING',
    waitingSince,
    socketId: `socket-${userId}`,
  });

  beforeEach(async () => {
    pipelineMock = {
      hgetall: jest.fn().mockReturnThis(),
      zrem: jest.fn().mockReturnThis(),
      hset: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockRedis = {
      zrange: jest.fn(),
      pipeline: jest.fn(() => pipelineMock),
      hgetall: jest.fn(),
      zrem: jest.fn(),
      hset: jest.fn(),
      exec: jest.fn(),
    };

    mockRoomService = {
      createMatchedRoom: jest.fn().mockResolvedValue({
        room: {
          roomId: 'room-123',
          title: 'Test Room',
          status: 'in-battle',
          currentPlayers: [],
        },
        battle: {
          battleId: 'battle-123',
          status: 'running',
          startedAt: new Date(),
        },
      }),
    };

    mockMatchingGateway = {
      emitMatchSuccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
        {
          provide: MatchingGateway,
          useValue: mockMatchingGateway,
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('matchUsers', () => {
    it('대기 중인 유저가 2명 미만이면 빈 배열을 반환해야 한다', async () => {
      mockRedis.zrange.mockResolvedValue(['user1']);
      pipelineMock.exec.mockResolvedValue([
        [
          null,
          {
            userId: 'user1',
            username: 'User1',
            rating: '1500',
            tier: JSON.stringify({ name: 'Gold', level: 3 }),
            status: 'WAITING',
            waitingSince: new Date().toISOString(),
            socketId: 'socket-1',
          },
        ],
      ]);

      const result = await service.matchUsers();

      expect(result).toEqual([]);
      expect(mockRoomService.createMatchedRoom).not.toHaveBeenCalled();
    });

    it('매칭 가능한 유저 쌍을 성공적으로 매칭해야 한다', async () => {
      const now = new Date();
      const user1Data = {
        userId: 'user1',
        username: 'User1',
        rating: '1500',
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: now.toISOString(),
        socketId: 'socket-1',
      };
      const user2Data = {
        userId: 'user2',
        username: 'User2',
        rating: '1550',
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: now.toISOString(),
        socketId: 'socket-2',
      };

      mockRedis.zrange.mockResolvedValue(['user1', 'user2']);
      pipelineMock.exec.mockResolvedValueOnce([
        [null, user1Data],
        [null, user2Data],
      ]);
      pipelineMock.exec.mockResolvedValueOnce([
        [null, 'OK'],
        [null, 'OK'],
        [null, 'OK'],
      ]);

      const result = await service.matchUsers();

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[1].userId).toBe('user2');
      expect(mockRoomService.createMatchedRoom).toHaveBeenCalledTimes(1);
      expect(mockMatchingGateway.emitMatchSuccess).toHaveBeenCalledTimes(1);
    });

    it('한 Tick에서 최대 5쌍까지만 매칭해야 한다', async () => {
      const now = new Date();
      const userIds = Array.from({ length: 20 }, (_, i) => `user${i + 1}`);
      const userData = userIds.map((userId, index) => [
        null,
        {
          userId,
          username: `User${index + 1}`,
          rating: String(1500 + index * 10),
          tier: JSON.stringify({ name: 'Gold', level: 3 }),
          status: 'WAITING',
          waitingSince: now.toISOString(),
          socketId: `socket-${index + 1}`,
        },
      ]);

      mockRedis.zrange.mockResolvedValue(userIds);
      pipelineMock.exec.mockResolvedValueOnce(userData);
      pipelineMock.exec.mockResolvedValue([[null, 'OK']]);

      const result = await service.matchUsers();

      // 최대 5쌍 = 10명
      expect(result.length).toBeLessThanOrEqual(MATCHING_CONFIG.MAX_MATCH_PER_TICK * 2);
      expect(mockRoomService.createMatchedRoom).toHaveBeenCalledTimes(
        Math.min(MATCHING_CONFIG.MAX_MATCH_PER_TICK, Math.floor(userIds.length / 2)),
      );
    });

    it('매칭 성공 후 Redis에서 상태를 업데이트해야 한다', async () => {
      const now = new Date();
      const user1Data = {
        userId: 'user1',
        username: 'User1',
        rating: '1500',
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: now.toISOString(),
        socketId: 'socket-1',
      };
      const user2Data = {
        userId: 'user2',
        username: 'User2',
        rating: '1550',
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: now.toISOString(),
        socketId: 'socket-2',
      };

      mockRedis.zrange.mockResolvedValue(['user1', 'user2']);
      pipelineMock.exec.mockResolvedValueOnce([
        [null, user1Data],
        [null, user2Data],
      ]);
      pipelineMock.exec.mockResolvedValueOnce([[null, 'OK']]);

      await service.matchUsers();

      expect(pipelineMock.zrem).toHaveBeenCalledWith(RedisKeys.matchingQueue(), 'user1', 'user2');
      expect(pipelineMock.hset).toHaveBeenCalledWith(
        RedisKeys.matchingUser('user1'),
        'status',
        'MATCHED',
      );
      expect(pipelineMock.hset).toHaveBeenCalledWith(
        RedisKeys.matchingUser('user2'),
        'status',
        'MATCHED',
      );
    });

    it('레이팅 차이가 허용 범위를 벗어나면 매칭하지 않아야 한다', async () => {
      const now = new Date();
      const user1Data = {
        userId: 'user1',
        username: 'User1',
        rating: '1000', // 레이팅 차이 500 (허용 범위 100 초과)
        tier: JSON.stringify({ name: 'Bronze', level: 1 }),
        status: 'WAITING',
        waitingSince: now.toISOString(),
        socketId: 'socket-1',
      };
      const user2Data = {
        userId: 'user2',
        username: 'User2',
        rating: '1500',
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: now.toISOString(),
        socketId: 'socket-2',
      };

      mockRedis.zrange.mockResolvedValue(['user1', 'user2']);
      pipelineMock.exec.mockResolvedValueOnce([
        [null, user1Data],
        [null, user2Data],
      ]);

      const result = await service.matchUsers();

      expect(result).toEqual([]);
      expect(mockRoomService.createMatchedRoom).not.toHaveBeenCalled();
    });

    it('대기 시간이 길면 레이팅 허용 범위가 확장되어 매칭되어야 한다', async () => {
      const longWaitTime = new Date(Date.now() - 25000); // 25초 전 (범위 150)
      const user1Data = {
        userId: 'user1',
        username: 'User1',
        rating: '1000',
        tier: JSON.stringify({ name: 'Bronze', level: 1 }),
        status: 'WAITING',
        waitingSince: longWaitTime.toISOString(),
        socketId: 'socket-1',
      };
      const user2Data = {
        userId: 'user2',
        username: 'User2',
        rating: '1140', // 차이 140 (25초 대기 시 허용 범위 150)
        tier: JSON.stringify({ name: 'Silver', level: 3 }),
        status: 'WAITING',
        waitingSince: longWaitTime.toISOString(),
        socketId: 'socket-2',
      };

      mockRedis.zrange.mockResolvedValue(['user1', 'user2']);
      pipelineMock.exec.mockResolvedValueOnce([
        [null, user1Data],
        [null, user2Data],
      ]);
      pipelineMock.exec.mockResolvedValueOnce([[null, 'OK']]);

      const result = await service.matchUsers();

      expect(result).toHaveLength(2);
      expect(mockRoomService.createMatchedRoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('레이팅 범위 계산 (간접 테스트)', () => {
    it('초기 대기 시간(0-20초)에는 기본 범위를 사용해야 한다', async () => {
      const recentTime = new Date(Date.now() - 10000); // 10초 전
      const user1Data = {
        userId: 'user1',
        username: 'User1',
        rating: '1500',
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: recentTime.toISOString(),
        socketId: 'socket-1',
      };
      const user2Data = {
        userId: 'user2',
        username: 'User2',
        rating: '1595', // 차이 95 < 100 (초기 범위)
        tier: JSON.stringify({ name: 'Gold', level: 3 }),
        status: 'WAITING',
        waitingSince: recentTime.toISOString(),
        socketId: 'socket-2',
      };

      mockRedis.zrange.mockResolvedValue(['user1', 'user2']);
      pipelineMock.exec.mockResolvedValueOnce([
        [null, user1Data],
        [null, user2Data],
      ]);
      pipelineMock.exec.mockResolvedValueOnce([[null, 'OK']]);

      const result = await service.matchUsers();

      expect(result).toHaveLength(2);
    });
  });

  describe('중복 매칭 방지', () => {
    it('이미 매칭된 유저는 재매칭되지 않아야 한다', async () => {
      const now = new Date();
      const users = [
        {
          userId: 'user1',
          username: 'User1',
          rating: '1500',
          tier: JSON.stringify({ name: 'Gold', level: 3 }),
          status: 'WAITING',
          waitingSince: now.toISOString(),
          socketId: 'socket-1',
        },
        {
          userId: 'user2',
          username: 'User2',
          rating: '1510',
          tier: JSON.stringify({ name: 'Gold', level: 3 }),
          status: 'WAITING',
          waitingSince: now.toISOString(),
          socketId: 'socket-2',
        },
        {
          userId: 'user3',
          username: 'User3',
          rating: '1520',
          tier: JSON.stringify({ name: 'Gold', level: 3 }),
          status: 'WAITING',
          waitingSince: now.toISOString(),
          socketId: 'socket-3',
        },
        {
          userId: 'user4',
          username: 'User4',
          rating: '1530',
          tier: JSON.stringify({ name: 'Gold', level: 3 }),
          status: 'WAITING',
          waitingSince: now.toISOString(),
          socketId: 'socket-4',
        },
      ];

      mockRedis.zrange.mockResolvedValue(['user1', 'user2', 'user3', 'user4']);
      pipelineMock.exec.mockResolvedValueOnce(users.map((user) => [null, user]));
      pipelineMock.exec.mockResolvedValue([[null, 'OK']]);

      const result = await service.matchUsers();

      // 4명이면 2쌍 매칭 가능
      expect(result).toHaveLength(4);
      // 각 유저는 한 번씩만 매칭
      const userIds = result.map((u) => u.userId);
      expect(new Set(userIds).size).toBe(4); // 중복 없음
    });
  });
});
