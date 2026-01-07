import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SOCKET_EVENT, SOCKET_NAMESPACE } from '@packages/constants/socket-event';
import { Battle } from '@packages/types/battle';
import { MatchingUser } from '@packages/types/matching';
import { Room } from '@packages/types/room';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: SOCKET_NAMESPACE.GAME })
export class MatchingGateway {
  @WebSocketServer() server: Server;

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
}
