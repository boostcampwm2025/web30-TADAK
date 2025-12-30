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

import {
  SOCKET_ERROR,
  SOCKET_EVENT,
  SOCKET_NAMESPACE,
} from '../../../../packages/constants/socket-event';
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
    @MessageBody() data: { roomId: string; requestedRole: UserRole },
  ) {
    const { roomId, requestedRole } = data;

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

    const username = `User-${Date.now().toString().slice(-4)}`;

    const newUser: RoomUser = {
      roomId: roomId,
      userId: client.id,
      username: username,
      socketId: client.id,
      role: requestedRole,
      joinedAt: new Date(),
    };

    if (requestedRole === 'player') {
      room.currentPlayers.push(newUser);
    } else {
      room.currentSpectators.push(newUser);
    }

    await this.roomService.saveRoom(room);

    await client.join(roomId);

    // 참가자일 경우 배틀에도 참가
    if (requestedRole === 'player') {
      await this.battleService.joinBattle(roomId, newUser);
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
      userId: client.id,
      username: username,
    });

    // 같은 방 다른 사람들에게 새 유저 입장 알림
    client.to(roomId).emit(SOCKET_EVENT.ROOM_USER_JOINED, {
      playerCount: room.currentPlayers.length,
    });
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
      // 같은 방 다른 사람들에게 유저 퇴장 알림
      client.to(roomId).emit(SOCKET_EVENT.ROOM_USER_LEFT, {
        playerCount: updatedRoom.currentPlayers.length,
      });
    }

    // 소켓 룸에서 나가기
    await client.leave(roomId);
  }
}
