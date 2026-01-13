import { Inject, Injectable, Logger } from '@nestjs/common';
import { BATTLE_CONFIG } from '@packages/constants/battle';
import { Battle } from '@packages/types/battle';
import { MatchingUser } from '@packages/types/matching';
import { RoomUser } from '@packages/types/user';
import Redis from 'ioredis';

import { ROOM_CONFIG } from '../../../../packages/constants/socket-event';
import { Room, RoomAvailabilityResponseDTO, RoomSettings } from '../../../../packages/types/room';
import { BattleService } from '../battle/battle.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';

type PublicRoom = Omit<Room, 'currentPlayers' | 'currentSpectators'> & {
  currentPlayers: Array<Omit<RoomUser, 'socketId'>>;
  currentSpectators: Array<Omit<RoomUser, 'socketId'>>;
};

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
  async createMatchedRoom(
    user1: MatchingUser,
    user2: MatchingUser,
  ): Promise<{ room: Room; battle: Battle }> {
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
        avatarUrl: user1.avatarUrl,
        joinedAt: now,
      };

      const player2: RoomUser = {
        userId: user2.userId,
        username: user2.username,
        socketId: user2.socketId,
        roomId: roomId,
        role: 'player',
        avatarUrl: user2.avatarUrl,
        joinedAt: now,
      };

      const room = await this.createRoom({
        roomId,
        title: `${user1.username} vs ${user2.username}`,
        status: 'in-battle',
        currentPlayers: [player1, player2],
      });

      // 배틀 생성
      const battle = await this.BattleService.createBattle({
        roomId: room.roomId,
        config: {
          duration: BATTLE_CONFIG.DURATION,
        },
        users: room.currentPlayers.map((player) => player.userId),
      });

      this.logger.log(
        `Created matched room ${room.roomId} for users ${user1.userId} and ${user2.userId}`,
      );
      return { room, battle };
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
      return { roomId, playerCount: 0, spectatorCount: 0, isAvailable: false };
    }

    const playerCount = room.currentPlayers.length;
    const spectatorCount = room.currentSpectators.length;
    const isAvailable = playerCount < ROOM_CONFIG.MAX_PLAYERS;

    return { roomId, playerCount, spectatorCount, isAvailable };
  }

  async saveRoom(room: Room): Promise<void> {
    const key = RedisKeys.room(room.roomId);
    await this.redis.set(key, JSON.stringify(room));
  }

  async listRooms(): Promise<Room[]> {
    // 방 정보를 담고 있는 모든 키 조회
    const keys = await this.redis.keys(RedisKeys.room('*'));
    if (!keys.length) return [];

    // 파이프라인으로 한 번에 조회 후 파싱
    const pipeline = this.redis.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = (await pipeline.exec()) as [Error | null, string | null][];

    const rooms: Room[] = [];
    results.forEach(([err, value]) => {
      if (err || !value) return;
      try {
        const parsed = JSON.parse(value) as Room;
        rooms.push(parsed);
      } catch (e) {
        this.logger.warn(`Failed to parse room data: ${e}`);
      }
    });

    return rooms;
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

  async deleteRoom(roomId: string): Promise<void> {
    const key = RedisKeys.room(roomId);
    await this.redis.del(key);
    this.logger.log(`Deleted room ${roomId}`);
  }

  async listRooms(): Promise<Room[]> {
    // 방 정보를 담고 있는 모든 키 조회
    const keys = await this.redis.keys(RedisKeys.room('*'));
    if (!keys.length) return [];

    // 파이프라인으로 한 번에 조회 후 파싱
    const pipeline = this.redis.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = (await pipeline.exec()) as [Error | null, string | null][];

    const rooms: Room[] = [];
    results.forEach(([err, value]) => {
      if (err || !value) return;
      try {
        const parsed = JSON.parse(value) as Room;
        rooms.push(parsed);
      } catch (e) {
        this.logger.warn(`Failed to parse room data: ${e}`);
      }
    });

    return rooms;
  }

  // 클라이언트에 노출할 때 socketId 등 민감 정보를 제거한 방 데이터

  toPublicRooms(rooms: Room[]): PublicRoom[] {
    return rooms.map((room) => ({
      ...room,
      currentPlayers: room.currentPlayers.map(({ socketId: _socketId, ...rest }) => rest),
      currentSpectators: room.currentSpectators.map(({ socketId: _socketId, ...rest }) => rest),
    }));
  }
}
