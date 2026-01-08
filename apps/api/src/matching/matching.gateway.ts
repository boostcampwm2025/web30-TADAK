import { forwardRef, Inject, Logger } from '@nestjs/common';
import { OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SOCKET_EVENT, SOCKET_NAMESPACE } from '@packages/constants/socket-event';
import { Battle } from '@packages/types/battle';
import { MatchingUser } from '@packages/types/matching';
import { Room } from '@packages/types/room';
import { Server, Socket } from 'socket.io';

import { MatchingService } from './matching.service';

@WebSocketGateway({ namespace: SOCKET_NAMESPACE.GAME })
export class MatchingGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MatchingGateway.name);

  constructor(
    @Inject(forwardRef(() => MatchingService))
    private readonly matchingService: MatchingService,
  ) {}

  async handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string }).userId;
    if (userId) {
      this.logger.log(`Client disconnected: ${userId}. Canceling match.`);
      await this.matchingService.cancelMatching(userId);
    }
  }

  // 매칭 시작 시 호출: 특정 소켓에 유저 ID를 심어 disconnect 시 처리 가능하게 함
  registerUserSocket(socketId: string, userId: string): void {
    const socket = this.findSocketById(socketId);
    if (socket) {
      (socket.data as { userId: string }).userId = userId;
      this.logger.log(`Socket ${socketId} registered for user ${userId}`);
    } else {
      this.logger.warn(`Failed to register: Socket ${socketId} not found`);
    }
  }

  // 특정 소켓 ID로 소켓 객체 찾기
  private findSocketById(socketId: string): Socket | undefined {
    return this.server.of(SOCKET_NAMESPACE.GAME).sockets.get(socketId);
  }

  // 매칭 성공 이벤트를 두 유저에게 전송
  emitMatchSuccess(user1: MatchingUser, user2: MatchingUser, room: Room, battle: Battle): void {
    // user1에게 전송
    this.server.to(user1.socketId).emit(SOCKET_EVENT.MATCH_SUCCESS, {
      roomId: room.roomId,
      battleId: battle.battleId,
      room,
      battle,
      opponent: {
        userId: user2.userId,
        username: user2.username,
        rating: user2.rating,
        tier: user2.tier,
      },
    });

    // user2에게 전송
    this.server.to(user2.socketId).emit(SOCKET_EVENT.MATCH_SUCCESS, {
      roomId: room.roomId,
      battleId: battle.battleId,
      room,
      battle,
      opponent: {
        userId: user1.userId,
        username: user1.username,
        rating: user1.rating,
        tier: user1.tier,
      },
    });
  }

  // 매칭 타임아웃 알림
  emitMatchingTimeout(socketId: string): void {
    this.server.to(socketId).emit(SOCKET_EVENT.MATCHING_TIMEOUT, {
      message: '매칭이 지연되고 있습니다.',
    });
  }

  // 상대방 연결 끊김 알림
  emitOpponentDisconnected(socketId: string): void {
    this.server.to(socketId).emit(SOCKET_EVENT.OPPONENT_DISCONNECTED, {
      message: '상대방의 연결이 끊겨 매칭이 취소되었습니다.',
    });
  }
}
