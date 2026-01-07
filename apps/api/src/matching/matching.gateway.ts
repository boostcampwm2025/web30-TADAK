import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
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

  // 매칭 시작 요청 - 사용자가 "매칭 시작" 버튼을 눌렀을 때 실행
  @SubscribeMessage(SOCKET_EVENT.START_MATCHING)
  async handleStartMatching(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { userId: string; rating: number; username: string; tier: MatchingUser['tier'] },
  ) {
    const { userId, rating, username, tier } = data;
    // 소켓 객체에 유저 ID 저장 (disconnect 시 사용)
    (client.data as { userId: string }).userId = userId;

    const matchingUser: MatchingUser = {
      userId,
      username,
      rating,
      tier,
      socketId: client.id, // 매칭 성공 시 알림을 보낼 주소(소켓ID)
      status: 'WAITING',
      waitingSince: new Date(),
    };

    await this.matchingService.startMatching(matchingUser);
  }

  // 매칭 취소 요청 - 사용자가 대기 중 "취소" 버튼을 눌렀을 때 실행
  @SubscribeMessage(SOCKET_EVENT.CANCEL_MATCHING)
  async handleCancelMatching(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    await this.matchingService.cancelMatching(userId);
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
      message: '매칭 시간이 초과되었습니다. 다시 시도해주세요.',
    });
  }

  // 상대방 연결 끊김 알림
  emitOpponentDisconnected(socketId: string): void {
    this.server.to(socketId).emit(SOCKET_EVENT.OPPONENT_DISCONNECTED, {
      message: '상대방의 연결이 끊겨 매칭이 취소되었습니다.',
    });
  }
}
