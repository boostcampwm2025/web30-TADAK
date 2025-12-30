import { Inject, Injectable } from '@nestjs/common';
import { BATTLE_CONFIG } from '@packages/constants/battle';
import Redis from 'ioredis';

import { ROOM_CONFIG } from '../../../../packages/constants/socket-event';
import { Room, RoomAvailabilityResponseDTO } from '../../../../packages/types/room';
import { BattleService } from '../battle/battle.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';

@Injectable()
export class RoomService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly BattleService: BattleService,
  ) {}

  async createRoom(roomId: string): Promise<Room> {
    const room = this.createDefaultRoom(roomId);
    const key = RedisKeys.room(room.roomId);
    await this.redis.set(key, JSON.stringify(room));

    // 룸 생성 후 배틀 생성
    await this.BattleService.createBattle({
      roomId: room.roomId,
      config: {
        duration: BATTLE_CONFIG.DURATION,
      },
      users: [],
    });

    return room;
  }

  private createDefaultRoom(roomId: string): Room {
    return {
      roomId,
      title: `배틀룸 ${roomId}`,
      hostId: 'system',
      status: 'waiting',
      createdAt: new Date(),
      currentPlayers: [],
      currentSpectators: [],
      settings: {
        maxPlayers: ROOM_CONFIG.MAX_PLAYERS,
      },
    };
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const key = RedisKeys.room(roomId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as Room;
  }

  async getRoomAvailability(roomId: string): Promise<RoomAvailabilityResponseDTO> {
    const room = await this.getRoom(roomId);

    if (!room) {
      return { roomId, playerCount: 0, isAvailable: false };
    }

    const playerCount = room.currentPlayers.length;
    const isAvailable = playerCount < ROOM_CONFIG.MAX_PLAYERS;

    return { roomId, playerCount, isAvailable };
  }

  async saveRoom(room: Room): Promise<void> {
    const key = RedisKeys.room(room.roomId);
    await this.redis.set(key, JSON.stringify(room));
  }

  async removeUser(roomId: string, userId: string): Promise<Room | null> {
    const room = await this.getRoom(roomId);

    if (!room) {
      return null;
    }

    room.currentPlayers = room.currentPlayers.filter((user) => user.userId !== userId);
    room.currentSpectators = room.currentSpectators.filter((user) => user.userId !== userId);

    await this.saveRoom(room);

    return room;
  }
}
