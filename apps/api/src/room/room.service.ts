import { Inject, Injectable, Logger } from '@nestjs/common';
import { BATTLE_CONFIG } from '@packages/constants/battle';
import { MatchingUser } from '@packages/types/matching';
import { RoomUser } from '@packages/types/user';
import Redis from 'ioredis';

import { ROOM_CONFIG } from '../../../../packages/constants/socket-event';
import { Room, RoomAvailabilityResponseDTO, RoomSettings } from '../../../../packages/types/room';
import { BattleService } from '../battle/battle.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly BattleService: BattleService,
  ) {}

  // 기본 방 생성
  async createRoom(params: Partial<Room> = {}): Promise<Room> {
    const roomId = params.roomId || `room-${Date.now()}-${Math.random().toString(36)}`;

    const defaultSettings: RoomSettings = {
      maxPlayers: ROOM_CONFIG.MAX_PLAYERS,
    };

    const newRoom: Room = {
      roomId,
      title: params.title || `배틀룸 ${roomId.substring(8)}`,
      hostId: params.hostId || 'system',
      status: params.status || 'waiting',
      createdAt: new Date(),
      currentPlayers: params.currentPlayers || [],
      currentSpectators: [],
      settings: {
        ...defaultSettings,
        ...params.settings,
      },
    };

    const key = RedisKeys.room(newRoom.roomId);
    await this.redis.set(key, JSON.stringify(newRoom));

    return newRoom;
  }

  // 매칭된 유저들로 방 생성 및 배틀 시작
  async createMatchedRoom(user1: MatchingUser, user2: MatchingUser): Promise<Room> {
    try {
      // 방 생성: 유저 정보와 즉시 시작 상태 주입
      const now = new Date();
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const player1: RoomUser = {
        userId: user1.userId,
        username: user1.username,
        socketId: user1.socketId, // MatchingUser에 보관된 socketId 활용
        roomId: roomId,
        role: 'player',
        joinedAt: now,
      };

      const player2: RoomUser = {
        userId: user2.userId,
        username: user2.username,
        socketId: user2.socketId,
        roomId: roomId,
        role: 'player',
        joinedAt: now,
      };

      const room = await this.createRoom({
        roomId,
        title: `${user1.username} vs ${user2.username}`,
        status: 'in-battle',
        currentPlayers: [player1, player2],
      });

      // 배틀 생성
      await this.BattleService.createBattle({
        roomId: room.roomId,
        config: {
          duration: BATTLE_CONFIG.DURATION,
        },
        users: room.currentPlayers.map((player) => player.userId),
      });

      this.logger.log(
        `Created matched room ${room.roomId} for users ${user1.userId} and ${user2.userId}`,
      );
      return room;
    } catch (error: unknown) {
      if (error instanceof Error)
        this.logger.error(`Failed to create matched room: ${error.message}`);
      throw error;
    }
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
