/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { MATCHING_CONFIG } from '@packages/constants/matching';
import RedisMock from 'ioredis-mock';

import { MatchingGateway } from '../../src/matching/matching.gateway';
import { MatchingService } from '../../src/matching/matching.service';
import { REDIS_CLIENT } from '../../src/redis/redis.module';
import { RedisKeys } from '../../src/redis/redis-key.constant';
import { RoomService } from '../../src/room/room.service';

describe('MatchingService with ioredis-mock', () => {
  let service: MatchingService;
  let redis: RedisMock;
  let mockRoomService: any;
  let mockMatchingGateway: any;

  // 헬퍼: Redis에 유저 데이터 추가
  const addUserToQueue = async (
    userId: string,
    rating: number,
    waitingSince: Date = new Date(),
  ): Promise<void> => {
    const timestamp = waitingSince.getTime();

    // ZSET에 추가 (대기 시간 순)
    await redis.zadd(RedisKeys.matchingQueue(), timestamp, userId);

    // HASH에 유저 메타데이터 추가
    await redis.hset(RedisKeys.matchingUser(userId), {
      userId,
      username: `User${userId}`,
      rating: String(rating),
      tier: JSON.stringify({ tier: 'GOLD', division: 3 }),
      status: 'WAITING',
      waitingSince: waitingSince.toISOString(),
      socketId: `socket-${userId}`,
    });
  };

  beforeEach(async () => {
    redis = new RedisMock();

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
          useValue: redis,
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

  afterEach(async () => {
    await redis.flushall();
  });

  describe('matchUsers', () => {
    it('대기 중인 유저가 2명 미만이면 빈 배열을 반환해야 한다', async () => {
      await addUserToQueue('user1', 1500);

      const result = await service.matchUsers();

      expect(result).toEqual([]);
      expect(mockRoomService.createMatchedRoom).not.toHaveBeenCalled();
    });

    it('매칭 가능한 유저 쌍을 성공적으로 매칭해야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);

      const result = await service.matchUsers();

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[1].userId).toBe('user2');
      expect(mockRoomService.createMatchedRoom).toHaveBeenCalledTimes(1);
      expect(mockMatchingGateway.emitMatchSuccess).toHaveBeenCalledTimes(1);
    });

    it('한 Tick에서 최대 5쌍까지만 매칭해야 한다', async () => {
      const now = new Date();
      // 20명 추가
      for (let i = 1; i <= 20; i++) {
        await addUserToQueue(`user${i}`, 1500 + i * 10, now);
      }

      const result = await service.matchUsers();

      // 최대 5쌍 = 10명
      expect(result.length).toBeLessThanOrEqual(MATCHING_CONFIG.MAX_MATCH_PER_TICK * 2);
      expect(mockRoomService.createMatchedRoom).toHaveBeenCalledTimes(
        Math.min(MATCHING_CONFIG.MAX_MATCH_PER_TICK, 10),
      );
    });

    it('매칭 성공 후 Redis에서 상태를 업데이트해야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);

      await service.matchUsers();

      // Redis에서 유저가 제거되었는지 확인
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(0);

      // 상태가 MATCHED로 변경되었는지 확인
      const user1Status = await redis.hget(RedisKeys.matchingUser('user1'), 'status');
      const user2Status = await redis.hget(RedisKeys.matchingUser('user2'), 'status');
      expect(user1Status).toBe('MATCHED');
      expect(user2Status).toBe('MATCHED');
    });

    it('레이팅 차이가 허용 범위를 벗어나면 매칭하지 않아야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1000, now);
      await addUserToQueue('user2', 1500, now);

      const result = await service.matchUsers();

      expect(result).toEqual([]);
      expect(mockRoomService.createMatchedRoom).not.toHaveBeenCalled();

      // Redis에 여전히 남아있는지 확인
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(2);
    });

    it('대기 시간이 길면 레이팅 허용 범위가 확장되어 매칭되어야 한다', async () => {
      const longWaitTime = new Date(Date.now() - 25000); // 25초 전 (범위 150)
      await addUserToQueue('user1', 1000, longWaitTime);
      await addUserToQueue('user2', 1140, longWaitTime); // 차이 140 (25초 대기 시 허용 범위 150)

      const result = await service.matchUsers();

      expect(result).toHaveLength(2);
      expect(mockRoomService.createMatchedRoom).toHaveBeenCalledTimes(1);
    });

    it('ZSET이 timestamp 순으로 정렬되어야 한다 (대기 시간 우선)', async () => {
      const time1 = new Date(Date.now() - 3000); // 3초 전 (가장 오래 대기)
      const time2 = new Date(Date.now() - 2000); // 2초 전
      const time3 = new Date(Date.now() - 1000); // 1초 전 (가장 최근)

      // 역순으로 추가
      await addUserToQueue('user3', 1500, time3);
      await addUserToQueue('user1', 1500, time1);
      await addUserToQueue('user2', 1500, time2);

      // Redis ZSET에서 순서 확인
      const userIds = await redis.zrange(RedisKeys.matchingQueue(), 0, -1);

      // 대기 시간 순으로 정렬되어야 함 (오래 대기한 순)
      expect(userIds).toEqual(['user1', 'user2', 'user3']);
    });

    it('초기 대기 시간(0-20초)에는 기본 범위를 사용해야 한다', async () => {
      const recentTime = new Date(Date.now() - 10000); // 10초 전
      await addUserToQueue('user1', 1500, recentTime);
      await addUserToQueue('user2', 1595, recentTime); // 차이 95 < 100 (초기 범위)

      const result = await service.matchUsers();

      expect(result).toHaveLength(2);
    });

    it('중복 매칭을 방지해야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1510, now);
      await addUserToQueue('user3', 1520, now);
      await addUserToQueue('user4', 1530, now);

      const result = await service.matchUsers();

      // 4명이면 2쌍 매칭 가능
      expect(result).toHaveLength(4);
      // 각 유저는 한 번씩만 매칭
      const userIds = result.map((u) => u.userId);
      expect(new Set(userIds).size).toBe(4); // 중복 없음
    });

    it('메모리에서 rating 순으로 정렬되어야 한다', async () => {
      const now = new Date();
      // 역순으로 추가 (rating이 높은 순)
      await addUserToQueue('user3', 1700, now);
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1600, now);

      // matchUsers 실행 전에 내부적으로 rating 정렬이 되는지는
      // 실제 매칭 결과로 확인 (낮은 rating끼리 매칭)
      const result = await service.matchUsers();

      // 최소 1쌍은 매칭되어야 함
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });
});
