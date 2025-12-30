import { Test, TestingModule } from '@nestjs/testing';

import { ROOM_CONFIG } from '../../../packages/constants/socket-event';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import { RedisKeys } from '../src/redis/redis-key.constant';
import { RoomService } from '../src/room/room.service';

describe('RoomService', () => {
  let service: RoomService;
  let mockRedis: { set: jest.Mock };

  beforeEach(async () => {
    mockRedis = {
      set: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  describe('createRoom', () => {
    it('올바른 구조의 Room 객체를 생성해야 한다', async () => {
      const result = await service.createRoom('1');

      expect(result).toMatchObject({
        roomId: '1',
        title: '배틀룸 1',
        hostId: 'system',
        status: 'waiting',
        currentPlayers: [],
        currentSpectators: [],
        settings: {
          maxPlayers: ROOM_CONFIG.MAX_PLAYERS,
        },
      });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('Redis에 방 정보를 저장해야 한다', async () => {
      await service.createRoom('1');

      expect(mockRedis.set).toHaveBeenCalledWith(RedisKeys.room('1'), expect.any(String));
    });
  });
});
