import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BATTLE_EVENTS } from '@packages/constants/battle';
import { SOCKET_NAMESPACE } from '@packages/constants/socket-event';
import { type UpdateUserCodeDTO } from '@packages/types/battle';
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
}
