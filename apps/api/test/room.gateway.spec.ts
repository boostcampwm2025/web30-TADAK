import { Test, TestingModule } from '@nestjs/testing';

import { RoomGateway } from '../src/room/room.gateway';
import { RoomService } from '../src/room/room.service';

describe('RoomGateway', () => {
  let _gateway: RoomGateway;
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
      ],
    }).compile();

    _gateway = module.get<RoomGateway>(RoomGateway);
    _roomService = module.get<RoomService>(RoomService);
  });
});
