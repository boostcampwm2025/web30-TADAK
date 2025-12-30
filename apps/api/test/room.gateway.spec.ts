import { Test, TestingModule } from '@nestjs/testing';

import { RoomGateway } from '../src/room/room.gateway';
import { RoomService } from '../src/room/room.service';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let roomService: RoomService;

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
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    roomService = module.get<RoomService>(RoomService);
  });

  describe('onModuleInit', () => {
    it('모듈 초기화 시 roomId 1번 방을 생성해야 한다', async () => {
      const createRoomSpy = jest.spyOn(roomService, 'createRoom');

      await gateway.onModuleInit();

      expect(createRoomSpy).toHaveBeenCalledTimes(1);
      expect(createRoomSpy).toHaveBeenCalledWith('1');
    });
  });
});
