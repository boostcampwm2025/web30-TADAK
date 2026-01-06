import { Test, TestingModule } from '@nestjs/testing';
import { MatchingUser } from '@packages/types/matching';

import { ROOM_CONFIG } from '../../../packages/constants/socket-event';
import { BattleService } from '../src/battle/battle.service';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import { RedisKeys } from '../src/redis/redis-key.constant';
import { RoomService } from '../src/room/room.service';

describe('RoomService', () => {
  let service: RoomService;
  let mockRedis: { set: jest.Mock };
  let mockBattleService: { createBattle: jest.Mock };

  beforeEach(async () => {
    mockRedis = {
      set: jest.fn().mockResolvedValue('OK'),
    };

    mockBattleService = {
      createBattle: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
        {
          provide: BattleService,
          useValue: mockBattleService,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  describe('createRoom', () => {
    it('인자 없이 호출해도 고유한 roomId를 포함한 객체를 생성해야 한다', async () => {
      const result = await service.createRoom();

      // roomId가 'room-'으로 시작하는지 확인 (Date.now 기반 패턴)
      expect(result.roomId).toMatch(/^room-/);
      expect(result).toMatchObject({
        title: expect.stringContaining('배틀룸') as string,
        hostId: 'system',
        status: 'waiting',
        currentPlayers: [],
        settings: {
          maxPlayers: ROOM_CONFIG.MAX_PLAYERS,
        },
      });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('params로 넘긴 값이 기본값을 덮어씌워야 한다', async () => {
      const customTitle = '나만의 방';
      const result = await service.createRoom({ title: customTitle, status: 'in-battle' });

      expect(result.title).toBe(customTitle);
      expect(result.status).toBe('in-battle');
    });

    it('Redis에 올바른 키값으로 데이터를 저장해야 한다', async () => {
      const result = await service.createRoom();

      expect(mockRedis.set).toHaveBeenCalledWith(RedisKeys.room(result.roomId), expect.any(String));
    });
  });

  describe('createMatchedRoom', () => {
    const mockUser1 = { userId: 'user1', username: '플레이어1', socketId: 'sid1' } as MatchingUser;
    const mockUser2 = { userId: 'user2', username: '플레이어2', socketId: 'sid2' } as MatchingUser;

    it('유저 정보가 매핑된 방을 생성하고 배틀 서비스를 호출해야 한다', async () => {
      const result = await service.createMatchedRoom(mockUser1, mockUser2);

      // 1. 결과 확인
      expect(result.currentPlayers).toHaveLength(2);
      expect(result.status).toBe('in-battle');
      expect(result.currentPlayers[0].roomId).toBe(result.roomId);

      // 2. BattleService 호출 확인
      expect(mockBattleService.createBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: result.roomId,
          users: expect.arrayContaining(['user1', 'user2']) as string[],
        }),
      );
    });
  });
});
