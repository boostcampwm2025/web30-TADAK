import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BATTLE_EVENTS } from '@packages/constants/battle';
import { CHAT_TYPE } from '@packages/constants/chat';
import { SOCKET_EVENT, SOCKET_NAMESPACE } from '@packages/constants/socket-event';
import {
  type UpdateUserCodeDTO,
  type UserFinishedPayload,
  type UserTestResultPayload,
} from '@packages/types/battle';
import { type ChatMessage } from '@packages/types/chat';
import { Server, Socket } from 'socket.io';

import { BattleService } from '@/battle/battle.service';

@WebSocketGateway({
  namespace: SOCKET_NAMESPACE.GAME,
})
export class BattleGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly battleService: BattleService) {}

  @SubscribeMessage(BATTLE_EVENTS.CODE_CHANGE)
  async handleChangeCode(@ConnectedSocket() client: Socket, @MessageBody() dto: UpdateUserCodeDTO) {
    try {
      const { roomId, userId, code, language } = dto;
      const battle = await this.battleService.updateUserCode(dto);

      if (!battle) {
        return { success: false, message: 'Battle or user not found' };
      }

      // 같은 방의 모든 사용자에게 브로드캐스트
      this.server.to(dto.roomId).emit(BATTLE_EVENTS.CODE_UPDATED, {
        roomId,
        userId,
        code,
        language,
      });

      return { success: true };
    } catch (error) {
      console.error('Error handling code change:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  // 테스트 결과 채팅 메시지 전송
  handleUserTestResult(payload: UserTestResultPayload) {
    const { roomId, username, passed } = payload;
    if (!roomId) return;

    const message = passed
      ? `${username ?? '플레이어'}님이 테스트를 통과했습니다!`
      : `${username ?? '플레이어'}님이 테스트를 통과하지 못했습니다.`;

    const systemMessage: ChatMessage = {
      type: CHAT_TYPE.SYSTEM,
      nickname: 'System',
      message,
      timestamp: new Date().toISOString(),
    };

    this.server.to(roomId).emit(SOCKET_EVENT.RECEIVE_CHAT, systemMessage);
  }

  // 제출 완료 채팅 메시지 전송
  handleUserFinished(payload: UserFinishedPayload) {
    const { roomId, username } = payload;
    if (!roomId) return;

    const systemMessage: ChatMessage = {
      type: CHAT_TYPE.SYSTEM,
      nickname: 'System',
      message: `${username ?? '플레이어'}님이 코드를 제출했습니다!`,
      timestamp: new Date().toISOString(),
    };

    this.server.to(roomId).emit(SOCKET_EVENT.RECEIVE_CHAT, systemMessage);
  }
}
