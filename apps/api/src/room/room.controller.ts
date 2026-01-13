import { Controller, Get } from '@nestjs/common';
import { Room } from '@packages/types/room';

import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('active')
  async getActiveRooms(): Promise<Room[]> {
    const rooms = await this.roomService.listRooms();
    // 기본적으로 생성된 모든 방을 내려주되, 필요 시 상태로 필터링
    return rooms.filter((room) => room.status === 'waiting' || room.status === 'in-battle');
  }
}
