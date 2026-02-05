import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BATTLE_EVENTS } from '@packages/constants/battle';
import { ProblemDataPayload } from '@packages/types/problem';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';

import { BattleService } from '@/battle/battle.service';
import { ProblemService } from '@/problem/problem.service';
import { UserService } from '@/user/user.service';

import { CHAT_TYPE } from '../../../../packages/constants/chat';
import {
  ROOM_CONFIG,
  SOCKET_ERROR,
  SOCKET_EVENT,
  SOCKET_NAMESPACE,
} from '../../../../packages/constants/socket-event';
import { type ChatMessage } from '../../../../packages/types/chat';
import { RoomUser, UserRole } from '../../../../packages/types/user';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';
import { RoomService } from './room.service';

@WebSocketGateway({ namespace: SOCKET_NAMESPACE.GAME })
export class RoomGateway {
  @WebSocketServer() server: Server;
  private rateLimitMap: Map<string, { count: number; windowStart: number; blockedUntil: number }> =
    new Map();
  private cheatWarningMap: Map<string, number> = new Map();
  private cheatCountMap: Map<string, number> = new Map();
  private readonly chatAuthErrorMessage = '로그인 후 채팅을 이용할 수 있습니다.';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly roomService: RoomService,
    private readonly battleService: BattleService,
    private readonly problemService: ProblemService,
    private readonly userService: UserService,
  ) {}

  @SubscribeMessage(SOCKET_EVENT.ROOM_LIST_REQUEST)
  async handleRoomListRequest(@ConnectedSocket() client: Socket) {
    const rooms = await this.roomService.listRooms();
    const publicRooms = await this.roomService.toPublicRooms(rooms);
    client.emit(SOCKET_EVENT.ROOM_LIST, publicRooms);
  }

  @SubscribeMessage(SOCKET_EVENT.CHECK_ROOM_AVAILABILITY)
  async handleCheckRoomAvailability(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    await client.join(roomId);

    const availability = await this.roomService.getRoomAvailability(roomId);

    client.emit(SOCKET_EVENT.ROOM_AVAILABILITY, availability);
  }

  @SubscribeMessage(SOCKET_EVENT.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      requestedRole: UserRole;
      userId?: string;
      username?: string;
      avatarUrl?: string;
    },
  ) {
    const { roomId, requestedRole, userId, username, avatarUrl } = data;

    const room = await this.roomService.getRoom(roomId);

    if (!room) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.ROOM_NOT_FOUND,
        message: '방을 찾을 수 없습니다.',
      });
      return;
    }

    const resolvedUserId = userId ?? client.id;
    const resolvedUsername = username ?? `User-${resolvedUserId.slice(-4)}`;
    const resolvedAvatar = avatarUrl;

    // 플레이어 권한 검증
    if (requestedRole === 'player') {
      if (!userId) {
        client.emit(SOCKET_EVENT.ERROR, {
          code: SOCKET_ERROR.INVALID_ROLE,
          message: '참가자만 배틀에 입장할 수 있습니다.',
        });
        return;
      }

      // 방의 플레이어 목록에 userId가 있어야 참가 허용
      const isAuthorizedPlayer = room.currentPlayers.some((player) => player.userId === userId);
      if (!isAuthorizedPlayer) {
        client.emit(SOCKET_EVENT.ERROR, {
          code: SOCKET_ERROR.INVALID_ROLE,
          message: '참가자만 배틀에 입장할 수 있습니다.',
        });
        return;
      }
    }

    // 기존 유저 재접속 처리: 동일 userId가 있으면 socketId만 교체
    const existingPlayer = room.currentPlayers.find((u) => u.userId === resolvedUserId);
    const existingSpectator = room.currentSpectators.find((u) => u.userId === resolvedUserId);
    const currentPlayerCount = room.currentPlayers.length;

    // 새 플레이어가 추가되는 경우에만 정원 체크
    if (requestedRole === 'player' && !existingPlayer && currentPlayerCount >= 2) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.ROOM_FULL,
        message: '방이 가득 찼습니다.',
      });
      return;
    }

    let newUser: RoomUser | null = null;

    if (existingPlayer) {
      existingPlayer.socketId = client.id;
      existingPlayer.username = resolvedUsername;
      existingPlayer.avatarUrl = resolvedAvatar;
      // 재접속 시 disconnect 타이머 취소
      this.battleService.cancelDisconnectTimer(resolvedUserId);
    } else if (existingSpectator) {
      existingSpectator.socketId = client.id;
      existingSpectator.username = resolvedUsername;
      existingSpectator.avatarUrl = resolvedAvatar;
    } else {
      newUser = {
        roomId: roomId,
        userId: resolvedUserId,
        username: resolvedUsername,
        socketId: client.id,
        role: requestedRole,
        avatarUrl: resolvedAvatar,
        joinedAt: new Date(),
      };

      if (requestedRole === 'player') {
        room.currentPlayers.push(newUser);
      } else {
        room.currentSpectators.push(newUser);
      }
    }

    await this.roomService.saveRoom(room);

    await client.join(roomId);

    // 참가자일 경우 배틀에도 참가
    if (requestedRole === 'player') {
      const playerUser = existingPlayer ?? newUser;
      if (playerUser) {
        await this.battleService.joinBattle(roomId, playerUser);
      }

      try {
        await this.redis.hset(RedisKeys.matchingUser(resolvedUserId), {
          status: 'IN_ROOM',
          joinedAt: new Date().toISOString(),
          roomId: roomId,
          username: resolvedUsername,
          socketId: client.id,
        });
      } catch {
        // ignore
      }
    }

    // 방 전체에 최신 참여자 목록 브로드캐스트 (통계 포함)
    const playersWithStats = await this.getPlayersWithStats(room.currentPlayers);
    this.server.to(roomId).emit(SOCKET_EVENT.ROOM_PLAYERS, {
      roomId: room.roomId,
      players: playersWithStats,
    });

    client.emit(SOCKET_EVENT.ROOM_STATE_ROLE, {
      roomId: room.roomId,
      role: requestedRole,
      userId: resolvedUserId,
      username: resolvedUsername,
      avatarUrl: resolvedAvatar,
    });

    // 방의 모든 사람에게 새 유저 입장 알림 (본인 포함)
    this.server.to(roomId).emit(SOCKET_EVENT.ROOM_USER_JOINED, {
      roomId,
      playerCount: room.currentPlayers.length,
      spectatorCount: room.currentSpectators.length,
    });

    // 문제 정보 전송
    const battle = await this.battleService.getBattleByRoomId(roomId);
    if (battle) {
      const problemEntity = await this.problemService.findOne(battle.problemId);
      if (problemEntity) {
        client.emit(SOCKET_EVENT.PROBLEM_INFO, {
          id: problemEntity.id,
          source: problemEntity.source,
          difficulty: problemEntity.difficulty,
          tags: problemEntity.tags,
          url: problemEntity.url,
          title: problemEntity.title,
          timeLimit: problemEntity.timeLimit,
          battleTimeLimit: problemEntity.battleTimeLimit,
          memoryLimit: problemEntity.memoryLimit,
          statement: problemEntity.statement,
          input: problemEntity.input,
          output: problemEntity.output,
          note: problemEntity.note,
          examples: problemEntity.examples,
          battleId: battle.battleId,
          startedAt: battle.startedAt ? new Date(battle.startedAt).toISOString() : undefined,
          duration: battle.config.duration,
          serverTime: new Date().toISOString(),
        } as ProblemDataPayload);
      }

      // 현재 코드 스냅샷 전송 (관전자/플레이어 재접속 대비)
      battle.users.forEach((user) => {
        client.emit(BATTLE_EVENTS.CODE_UPDATED, {
          roomId,
          userId: user.userId,
          code: user.code,
          language: user.language,
        });

        // 현재 진행률 스냅샷 전송
        if (user.progress) {
          client.emit('submission-result', {
            submissionId: `sync-${Date.now()}`,
            status: 'SYNC',
            userId: user.userId,
            result: {
              passed: user.progress.passedCount,
              total: user.progress.totalCount,
            },
          });
        }
      });
    }

    // 최신 인원 정보를 브로드캐스트
    const availability = await this.roomService.getRoomAvailability(roomId);
    this.server.to(roomId).emit(SOCKET_EVENT.ROOM_AVAILABILITY, availability);

    if (requestedRole === 'player') {
      await this.updateBattleRoomStatus(roomId);
    }
  }

  private async updateBattleRoomStatus(roomId: string): Promise<void> {
    const room = await this.roomService.getRoom(roomId);
    if (!room || room.status === 'in-battle') return;
    if (room.currentPlayers.length < ROOM_CONFIG.MAX_PLAYERS) return;

    const pipeline = this.redis.pipeline();
    room.currentPlayers.forEach((player) => {
      pipeline.hget(RedisKeys.matchingUser(player.userId), 'status');
    });

    const results = (await pipeline.exec()) as [Error | null, string | null][];
    const allJoined = results.every(([err, status]) => !err && status === 'IN_ROOM');
    if (!allJoined) return;

    room.status = 'in-battle';
    await this.roomService.saveRoom(room);

    const rooms = await this.roomService.listRooms();
    const publicRooms = await this.roomService.toPublicRooms(rooms);
    this.server.emit(SOCKET_EVENT.ROOM_LIST, publicRooms);
  }

  @SubscribeMessage(SOCKET_EVENT.LEAVE_ROOM)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    const room = await this.roomService.getRoom(roomId);

    if (!room) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.ROOM_NOT_FOUND,
        message: '방을 찾을 수 없습니다.',
      });
      return;
    }

    const participant =
      room.currentPlayers.find((user) => user.socketId === client.id) ??
      room.currentSpectators.find((user) => user.socketId === client.id);

    if (!participant) {
      await client.leave(roomId);
      return;
    }

    const participantUserId = participant.userId;
    const isPlayer = participant.role === 'player';

    // 참가자일 경우 배틀에서도 제거
    if (isPlayer) {
      await this.battleService.leaveBattle(roomId, participantUserId);
    }

    // 방에서 사용자 제거
    const updatedRoom = await this.roomService.removeUser(roomId, participantUserId);

    if (updatedRoom) {
      // 방의 모든 사람에게 유저 퇴장 알림 (본인 제외)
      client.to(roomId).emit(SOCKET_EVENT.ROOM_USER_LEFT, {
        roomId,
        playerCount: updatedRoom.currentPlayers.length,
        spectatorCount: updatedRoom.currentSpectators.length,
      });

      // 최신 인원 정보를 브로드캐스트
      const availability = await this.roomService.getRoomAvailability(roomId);
      this.server.to(roomId).emit(SOCKET_EVENT.ROOM_AVAILABILITY, availability);
    }

    // 소켓 룸에서 나가기
    await client.leave(roomId);
  }

  @SubscribeMessage(SOCKET_EVENT.SEND_CHAT)
  async handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: string; nickname?: string; avatarUrl?: string },
  ) {
    const { roomId, message, nickname, avatarUrl } = data ?? {};
    const trimmedMessage = message?.trim();

    if (!roomId || !trimmedMessage) {
      return;
    }

    const room = await this.roomService.getRoom(roomId);
    if (!room) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.ROOM_NOT_FOUND,
        message: '방을 찾을 수 없습니다.',
      });
      return;
    }

    const participant =
      room.currentPlayers.find((user) => user.socketId === client.id) ??
      room.currentSpectators.find((user) => user.socketId === client.id);

    // 방에 참가하지 않은 유저는 채팅 불가
    if (!participant || participant.userId === client.id) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.UNKNOWN,
        message: this.chatAuthErrorMessage,
      });
      return;
    }

    // Rate limit: 2초 내 5회 초과 시 2초간 차단
    const now = Date.now();
    const limiter = this.rateLimitMap.get(client.id) ?? {
      count: 0,
      windowStart: now,
      blockedUntil: 0,
    };

    if (now < limiter.blockedUntil) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.UNKNOWN,
        message: '채팅 전송이 잠시 제한되었습니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }

    if (now - limiter.windowStart > 2000) {
      limiter.windowStart = now;
      limiter.count = 0;
    }

    limiter.count += 1;
    if (limiter.count > 5) {
      limiter.blockedUntil = now + 2000;
      this.rateLimitMap.set(client.id, limiter);
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.UNKNOWN,
        message: '너무 빠르게 입력하고 있습니다. 2초 후 다시 시도해주세요.',
      });
      return;
    }

    this.rateLimitMap.set(client.id, limiter);

    const safeMessage = this.sanitizeMessage(trimmedMessage);

    const chatMessage: ChatMessage = {
      type: CHAT_TYPE.USER,
      nickname: nickname ?? '익명',
      message: safeMessage,
      timestamp: new Date().toISOString(),
      avatarUrl,
    };

    this.server.to(roomId).emit(SOCKET_EVENT.RECEIVE_CHAT, chatMessage);

    return { success: true };
  }

  @SubscribeMessage(SOCKET_EVENT.CHEAT_WARNING)
  async handleCheatWarning(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; type?: 'FOCUS_OUT' | 'PASTE' },
  ) {
    if (process.env.CHEAT_DETECTION_ENABLED === 'false') {
      return;
    }
    const { roomId, type } = data ?? {};
    if (!roomId) return;

    const room = await this.roomService.getRoom(roomId);
    if (!room) return;

    const participant =
      room.currentPlayers.find((user) => user.socketId === client.id) ??
      room.currentSpectators.find((user) => user.socketId === client.id);

    if (!participant || participant.role !== 'player') {
      return;
    }

    const now = Date.now();
    const throttleKey = `${roomId}:${participant.userId}`;
    const lastSent = this.cheatWarningMap.get(throttleKey) ?? 0;
    if (now - lastSent < 1000) return;
    this.cheatWarningMap.set(throttleKey, now);

    const maxWarnings = 5;
    const currentCount = this.cheatCountMap.get(throttleKey) ?? 0;
    const nextCount = Math.min(maxWarnings, currentCount + 1);
    this.cheatCountMap.set(throttleKey, nextCount);

    const username = participant.username ?? '플레이어';
    const reason = type === 'PASTE' ? '외부 코드 붙여넣기 시도' : '화면 이탈 감지';
    const message = `[SYSTEM] ${username}님 부정행위 경고 ${nextCount}/${maxWarnings} (${reason})`;

    const chatMessage: ChatMessage = {
      type: CHAT_TYPE.SYSTEM,
      nickname: 'SYSTEM',
      message,
      timestamp: new Date().toISOString(),
    };

    this.server.to(roomId).emit(SOCKET_EVENT.RECEIVE_CHAT, chatMessage);

    if (nextCount < maxWarnings) return;

    try {
      const battle = await this.battleService.getBattleByRoomId(roomId);
      if (!battle) {
        return;
      }

      const result = await this.battleService.forfeitBattle(battle.battleId, participant.userId);

      this.server.to(roomId).emit(BATTLE_EVENTS.BATTLE_ENDED, {
        battleId: result.id,
        winnerId: result.winnerId,
      });

      const finalMessage: ChatMessage = {
        type: CHAT_TYPE.SYSTEM,
        nickname: 'SYSTEM',
        message: `[SYSTEM] ${username}님이 부정행위 누적으로 패배 처리되었습니다.`,
        timestamp: new Date().toISOString(),
      };
      this.server.to(roomId).emit(SOCKET_EVENT.RECEIVE_CHAT, finalMessage);

      await this.roomService.completeBattleRoom(roomId);
      const rooms = await this.roomService.listRooms();
      const publicRooms = await this.roomService.toPublicRooms(rooms);
      this.server.emit(SOCKET_EVENT.ROOM_LIST, publicRooms);

      this.cheatCountMap.delete(throttleKey);
      this.cheatWarningMap.delete(throttleKey);
    } catch (error) {
      console.error('[RoomGateway] cheat forfeit error:', error);
      // 실패 시 카운트를 유지해 다음 경고에서 재시도
    }
  }

  private sanitizeMessage(message: string): string {
    // 간단한 escape 처리로 스크립트 실행 방지
    const escaped = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return escaped.replace(/javascript:/gi, '').replace(/on\w+="[^"]*"/gi, '');
  }

  private async getPlayersWithStats(players: RoomUser[]): Promise<RoomUser[]> {
    const playersWithStats = await Promise.all(
      players.map(async (player) => {
        const user = await this.userService.findOne(player.userId);
        if (user) {
          return {
            ...player,
            stats: {
              wins: user.wins,
              losses: user.losses,
              rating: user.rating,
              tier: user.tier,
            },
          };
        }
        return player;
      }),
    );
    return playersWithStats;
  }
}
