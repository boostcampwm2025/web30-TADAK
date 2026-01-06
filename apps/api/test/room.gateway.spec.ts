import { Test, TestingModule } from '@nestjs/testing';

import { BattleService } from '@/battle/battle.service';

import { RoomGateway } from '../src/room/room.gateway';
import { RoomService } from '../src/room/room.service';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let _roomService: RoomService;

  beforeEach(async () => {
    const mockRoomService = {
      createRoom: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGateway,
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
        {
          provide: BattleService,
          useValue: { createBattle: jest.fn() },
        },
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    _roomService = module.get<RoomService>(RoomService);
  });

  describe('RoomGateway', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });
  });
});
