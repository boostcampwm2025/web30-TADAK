import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { BattleService } from '@/battle/battle.service';

import { CHAT_TYPE } from '../../../../packages/constants/chat';
import {
  SOCKET_ERROR,
  SOCKET_EVENT,
  SOCKET_NAMESPACE,
} from '../../../../packages/constants/socket-event';
import { type ChatMessage } from '../../../../packages/types/chat';
import { RoomUser, UserRole } from '../../../../packages/types/user';
import { RoomService } from './room.service';

@WebSocketGateway({ namespace: SOCKET_NAMESPACE.GAME })
export class RoomGateway implements OnModuleInit {
  @WebSocketServer() server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly battleService: BattleService,
  ) {}

  async onModuleInit() {
    await this.roomService.createRoom('1');
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

    const currentPlayerCount = room.currentPlayers.length;

    if (requestedRole === 'player' && currentPlayerCount >= 2) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.ROOM_FULL,
        message: '방이 가득 찼습니다.',
      });
      return;
    }

    const resolvedUserId = userId ?? client.id;
    const resolvedUsername = username ?? `User-${resolvedUserId.slice(-4)}`;
    const resolvedAvatar = avatarUrl;

    // 기존 유저 재접속 처리: 동일 userId가 있으면 socketId만 교체
    const existingPlayer = room.currentPlayers.find((u) => u.userId === resolvedUserId);
    const existingSpectator = room.currentSpectators.find((u) => u.userId === resolvedUserId);

    let newUser: RoomUser | null = null;

    if (existingPlayer) {
      existingPlayer.socketId = client.id;
      existingPlayer.username = resolvedUsername;
      existingPlayer.avatarUrl = resolvedAvatar;
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
    }

    // 방 전체에 최신 참여자 목록 브로드캐스트
    const players = [...room.currentPlayers];
    this.server.to(roomId).emit(SOCKET_EVENT.ROOM_PLAYERS, {
      roomId: room.roomId,
      players,
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
      playerCount: room.currentPlayers.length,
      spectatorCount: room.currentSpectators.length,
    });

    // 최신 인원 정보를 브로드캐스트
    const availability = await this.roomService.getRoomAvailability(roomId);
    this.server.to(roomId).emit(SOCKET_EVENT.ROOM_AVAILABILITY, availability);
  }

  @SubscribeMessage(SOCKET_EVENT.LEAVE_ROOM)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.id;

    const room = await this.roomService.getRoom(roomId);

    if (!room) {
      client.emit(SOCKET_EVENT.ERROR, {
        code: SOCKET_ERROR.ROOM_NOT_FOUND,
        message: '방을 찾을 수 없습니다.',
      });
      return;
    }

    // 참가자인지 확인
    const isPlayer = room.currentPlayers.some((player) => player.userId === userId);

    // 참가자일 경우 배틀에서도 제거
    if (isPlayer) {
      await this.battleService.leaveBattle(roomId, userId);
    }

    // 방에서 사용자 제거
    const updatedRoom = await this.roomService.removeUser(roomId, userId);

    if (updatedRoom) {
      // 방의 모든 사람에게 유저 퇴장 알림 (본인 제외)
      client.to(roomId).emit(SOCKET_EVENT.ROOM_USER_LEFT, {
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
  handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; message: string; nickname?: string; avatarUrl?: string },
  ) {
    const { roomId, message, nickname, avatarUrl } = data ?? {};
    const trimmedMessage = message?.trim();

    if (!roomId || !trimmedMessage) {
      return;
    }

    const chatMessage: ChatMessage = {
      type: CHAT_TYPE.USER,
      nickname: nickname ?? '익명',
      message: trimmedMessage,
      timestamp: new Date().toISOString(),
      avatarUrl,
    };

    this.server.to(roomId).emit(SOCKET_EVENT.RECEIVE_CHAT, chatMessage);

    return { success: true };
  }
}
