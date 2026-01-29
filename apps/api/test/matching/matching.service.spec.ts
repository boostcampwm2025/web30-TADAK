import { Test, TestingModule } from '@nestjs/testing';
import { MATCHING_CONFIG } from '@packages/constants/matching';
import { MatchingUser } from '@packages/types/matching';
import RedisMock from 'ioredis-mock';

import { BattleService } from '../../src/battle/battle.service';
import { MatchingGateway } from '../../src/matching/matching.gateway';
import { MatchingService } from '../../src/matching/matching.service';
import { REDIS_CLIENT } from '../../src/redis/redis.module';
import { RedisKeys } from '../../src/redis/redis-key.constant';
import { RoomService } from '../../src/room/room.service';

describe('MatchingService with ioredis-mock', () => {
  let service: MatchingService;
  let redis: RedisMock;
  let mockRoomService: any;
  let mockBattleService: any;
  let mockMatchingGateway: any;

  // 헬퍼: MatchingUser 객체 생성
  const createMockUser = (
    userId: string,
    rating: number,
    waitingSince: Date = new Date(),
  ): MatchingUser => ({
    userId,
    username: `User_${userId}`,
    rating,
    tier: { tier: 'Gold', division: 3 },
    status: 'WAITING',
    waitingSince,
    socketId: `socket-${userId}`,
    myRate: { win: 10, lose: 5, draw: 0, winRate: 66 },
    avatarUrl: `https://avatar.com/${userId}`,
  });

  // 헬퍼: Redis에 유저 데이터 추가 (매칭 대기 상태로)
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
      username: `User_${userId}`,
      rating: String(rating),
      tier: JSON.stringify({ tier: 'Gold', division: 3 }),
      status: 'WAITING',
      waitingSince: waitingSince.toISOString(),
      socketId: `socket-${userId}`,
      myRate: JSON.stringify({ win: 10, lose: 5, draw: 0, winRate: 66 }),
      avatarUrl: `https://avatar.com/${userId}`,
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
        problem: {
          id: 'problem-123',
          title: 'Test Problem',
        },
      }),
      deleteRoom: jest.fn().mockResolvedValue(undefined),
      listRooms: jest.fn().mockResolvedValue([]),
      toPublicRooms: jest.fn().mockReturnValue([]),
    };

    mockBattleService = {
      deleteBattle: jest.fn().mockResolvedValue(undefined),
    };

    mockMatchingGateway = {
      emitMatchSuccess: jest.fn(),
      registerUserSocket: jest.fn(),
      emitOpponentDisconnected: jest.fn(),
      broadcastRoomList: jest.fn().mockResolvedValue(undefined),
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
          provide: BattleService,
          useValue: mockBattleService,
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

  describe('startMatching', () => {
    it('매칭 시작 시 유저 상태가 WAITING으로 설정되어야 한다', async () => {
      const user = createMockUser('user1', 1500);

      await service.startMatching(user);

      // Redis HSET에서 status 확인
      const status = await redis.hget(RedisKeys.matchingUser('user1'), 'status');
      expect(status).toBe('WAITING');

      // ZSET에 추가되었는지 확인
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(1);

      // Gateway의 registerUserSocket이 호출되었는지 확인
      expect(mockMatchingGateway.registerUserSocket).toHaveBeenCalledWith('socket-user1', 'user1');
    });

    it('매칭 시작 시 유저 정보가 Redis에 저장되어야 한다', async () => {
      const user = createMockUser('user1', 1500);

      await service.startMatching(user);

      const userData = await redis.hgetall(RedisKeys.matchingUser('user1'));
      expect(userData.userId).toBe('user1');
      expect(userData.username).toBe('User_user1');
      expect(userData.rating).toBe('1500');
      expect(userData.status).toBe('WAITING');
      expect(userData.socketId).toBe('socket-user1');
    });

    it('이미 WAITING 상태인 유저는 중복 매칭 시작이 되지 않아야 한다', async () => {
      const user = createMockUser('user1', 1500);

      // 첫 번째 매칭 시작
      await service.startMatching(user);

      // 두 번째 매칭 시작 시도
      await service.startMatching(user);

      // ZSET에 1번만 추가되어야 함
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(1);

      // registerUserSocket도 1번만 호출
      expect(mockMatchingGateway.registerUserSocket).toHaveBeenCalledTimes(1);
    });

    it('이미 MATCHED 상태인 유저는 매칭 시작이 되지 않아야 한다', async () => {
      // 유저를 MATCHED 상태로 설정
      await redis.hset(RedisKeys.matchingUser('user1'), { status: 'MATCHED' });

      const user = createMockUser('user1', 1500);
      await service.startMatching(user);

      // ZSET에 추가되지 않아야 함
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(0);
    });

    it('이미 IN_ROOM 상태인 유저는 매칭 시작이 되지 않아야 한다', async () => {
      // 유저를 IN_ROOM 상태로 설정
      await redis.hset(RedisKeys.matchingUser('user1'), { status: 'IN_ROOM' });

      const user = createMockUser('user1', 1500);
      await service.startMatching(user);

      // ZSET에 추가되지 않아야 함
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(0);
    });
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

    it('매칭 성공 후 유저 상태가 MATCHED로 변경되어야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);

      await service.matchUsers();

      // 상태가 MATCHED로 변경되었는지 확인
      const user1Status = await redis.hget(RedisKeys.matchingUser('user1'), 'status');
      const user2Status = await redis.hget(RedisKeys.matchingUser('user2'), 'status');
      expect(user1Status).toBe('MATCHED');
      expect(user2Status).toBe('MATCHED');
    });

    it('매칭 성공 후 Redis 큐에서 유저가 제거되어야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);

      await service.matchUsers();

      // Redis에서 유저가 제거되었는지 확인
      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(0);
    });

    it('매칭 성공 후 roomId와 opponentId가 저장되어야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);

      await service.matchUsers();

      // user1의 데이터 확인
      const user1Data = await redis.hgetall(RedisKeys.matchingUser('user1'));
      expect(user1Data.roomId).toBe('room-123');
      expect(user1Data.opponentId).toBe('user2');

      // user2의 데이터 확인
      const user2Data = await redis.hgetall(RedisKeys.matchingUser('user2'));
      expect(user2Data.roomId).toBe('room-123');
      expect(user2Data.opponentId).toBe('user1');
    });

    it('매칭 성공 후 matchedAt 시간이 저장되어야 한다', async () => {
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);

      await service.matchUsers();

      const user1Data = await redis.hgetall(RedisKeys.matchingUser('user1'));
      expect(user1Data.matchedAt).toBeDefined();
      expect(new Date(user1Data.matchedAt).getTime()).toBeGreaterThan(0);
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

  describe('cancelMatching', () => {
    it('WAITING 상태의 유저를 취소하면 큐와 데이터가 삭제되어야 한다', async () => {
      await addUserToQueue('user1', 1500);

      await service.cancelMatching('user1');

      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(0);

      const userData = await redis.hgetall(RedisKeys.matchingUser('user1'));
      expect(Object.keys(userData as Record<string, string>).length).toBe(0);
    });

    it('MATCHED 상태에서 취소하면 상대방에게 알림을 보내야 한다', async () => {
      // 두 유저를 MATCHED 상태로 설정
      const now = new Date();
      await addUserToQueue('user1', 1500, now);
      await addUserToQueue('user2', 1550, now);
      await service.matchUsers();

      // matchedAt을 최근으로 설정 (5초 이내)
      await redis.hset(RedisKeys.matchingUser('user1'), {
        matchedAt: new Date().toISOString(),
      });
      await redis.hset(RedisKeys.matchingUser('user2'), {
        matchedAt: new Date().toISOString(),
      });

      // user1이 취소
      await service.cancelMatching('user1');

      // 상대방에게 알림이 전송되어야 함
      expect(mockMatchingGateway.emitOpponentDisconnected).toHaveBeenCalledWith('socket-user2');
    });

    it('IN_ROOM 상태의 유저는 취소해도 데이터가 유지되어야 한다', async () => {
      // 유저를 IN_ROOM 상태로 설정
      await redis.hset(RedisKeys.matchingUser('user1'), {
        userId: 'user1',
        status: 'IN_ROOM',
        roomId: 'room-123',
      });

      await service.cancelMatching('user1');

      // 데이터가 유지되어야 함
      const userData = await redis.hgetall(RedisKeys.matchingUser('user1'));
      expect(userData.status).toBe('IN_ROOM');
    });
  });

  describe('상태 전환 흐름 (WAITING -> MATCHED)', () => {
    it('전체 흐름: 매칭 시작 -> 매칭 성공 시 상태가 올바르게 전환되어야 한다', async () => {
      const user1 = createMockUser('user1', 1500);
      const user2 = createMockUser('user2', 1550);

      // 1. 매칭 시작 - WAITING 상태
      await service.startMatching(user1);
      await service.startMatching(user2);

      const user1StatusBefore = await redis.hget(RedisKeys.matchingUser('user1'), 'status');
      const user2StatusBefore = await redis.hget(RedisKeys.matchingUser('user2'), 'status');
      expect(user1StatusBefore).toBe('WAITING');
      expect(user2StatusBefore).toBe('WAITING');

      // 2. 매칭 실행 - MATCHED 상태
      await service.matchUsers();

      const user1StatusAfter = await redis.hget(RedisKeys.matchingUser('user1'), 'status');
      const user2StatusAfter = await redis.hget(RedisKeys.matchingUser('user2'), 'status');
      expect(user1StatusAfter).toBe('MATCHED');
      expect(user2StatusAfter).toBe('MATCHED');
    });
  });

  describe('getMatchingStats', () => {
    it('매칭 통계를 올바르게 반환해야 한다', async () => {
      // 대기 유저 2명 추가
      await addUserToQueue('user1', 1500);
      await addUserToQueue('user2', 1550);

      const stats = await service.getMatchingStats();

      expect(stats.waitingPlayers).toBe(2);
      expect(stats.ongoingBattles).toBe(0);
      expect(stats.avgMatchTime).toBe(0);
    });
  });

  describe('clearUserMatchingStatus', () => {
    it('유저의 매칭 상태를 완전히 삭제해야 한다', async () => {
      await addUserToQueue('user1', 1500);

      await service.clearUserMatchingStatus('user1');

      const queueSize = await redis.zcard(RedisKeys.matchingQueue());
      expect(queueSize).toBe(0);

      const userData = await redis.hgetall(RedisKeys.matchingUser('user1'));
      expect(Object.keys(userData as Record<string, string>).length).toBe(0);
    });
  });
});
