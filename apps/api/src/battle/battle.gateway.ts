import { forwardRef, Inject } from '@nestjs/common';
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
import { RoomService } from '@/room/room.service';

@WebSocketGateway({
  namespace: SOCKET_NAMESPACE.GAME,
})
export class BattleGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly battleService: BattleService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

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

      // 상대방에게 코드 변경 알림 전송
      const opponent = battle.users.find((user) => user.userId !== userId);
      if (opponent) {
        const opponentSocketId = await this.battleService.getSocketIdByUserId(opponent.userId);
        if (opponentSocketId) {
          this.server.to(opponentSocketId).emit(BATTLE_EVENTS.CODE_METADATA, {
            userId,
            codeLines: code.split('\n').filter((line) => line.trim().length > 0).length,
          });
        }
      }

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

  // 타이머 종료 이벤트 처리
  @SubscribeMessage(BATTLE_EVENTS.TIMER_END)
  async handleTimerEnd(@MessageBody() data: { battleId: string; roomId: string }) {
    const { battleId, roomId: roomIdFromClient } = data;
    try {
      const battle = await this.battleService.endBattleByTimeout(battleId);
      // 배틀 종료 알림 전송 (배틀 엔티티 기반)
      await this.emitBattleEnd(roomIdFromClient, battle.id, battle.winnerId);

      // 시스템 메시지 전송
      const systemMessage: ChatMessage = {
        type: CHAT_TYPE.SYSTEM,
        nickname: 'System',
        message: '배틀 시간이 종료되었습니다!',
        timestamp: new Date().toISOString(),
      };
      this.server.to(roomIdFromClient).emit(SOCKET_EVENT.RECEIVE_CHAT, systemMessage);
    } catch (error) {
      // 이미 종료된 배틀이거나 Redis 데이터가 없는 경우(FLUSHALL 등)
      // 클라이언트가 결과 페이지로 이동할 수 있도록 강제로 이벤트를 보냅니다.
      console.warn(
        `[BattleGateway] handleTimerEnd error or battle not found: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (roomIdFromClient) {
        this.server.to(roomIdFromClient).emit(BATTLE_EVENTS.BATTLE_ENDED, { battleId });

        // 방 상태 정리 및 목록 업데이트 시도
        try {
          await this.roomService.completeBattleRoom(roomIdFromClient);
          await this.broadcastRoomList();
        } catch (e) {
          console.error('[BattleGateway] Failed to cleanup room on error:', e);
        }
      } else {
        console.error('[BattleGateway] handleTimerEnd failed and no roomId provided');
      }
    }
  }

  // 배틀 나가기(포기) 이벤트 처리
  @SubscribeMessage(BATTLE_EVENTS.BATTLE_LEFT)
  async handleBattleLeft(
    @MessageBody() data: { battleId: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { battleId, roomId } = data;
    const userId = (client.data as { user?: { userId?: string } }).user?.userId;

    if (!userId) {
      console.error('[BattleGateway] handleBattleLeft: userId not found in socket data');
      return;
    }

    try {
      const battle = await this.battleService.forfeitBattle(battleId, userId);
      // 배틀 종료 알림 전송
      await this.emitBattleEnd(roomId, battle.id, battle.winnerId);
    } catch (error) {
      console.error('[BattleGateway] handleBattleLeft error:', error);
      // 에러 발생 시에도 배틀 종료 이벤트 전송
      if (roomId) {
        this.server.to(roomId).emit(BATTLE_EVENTS.BATTLE_ENDED, { battleId });
        try {
          await this.roomService.completeBattleRoom(roomId);
          await this.broadcastRoomList();
        } catch (e) {
          console.error('[BattleGateway] Failed to cleanup room on error:', e);
        }
      }
    }
  }

  // 배틀 종료 이벤트 브로드캐스트
  async emitBattleEnd(roomId: string, battleId: string, winnerId: string | null) {
    this.server.to(roomId).emit(BATTLE_EVENTS.BATTLE_ENDED, {
      battleId,
      winnerId,
    });

    // 방 상태 업데이트 및 목록 브로드캐스트
    try {
      await this.roomService.completeBattleRoom(roomId);
      await this.broadcastRoomList();
    } catch (error) {
      console.error('[BattleGateway] Failed to update room list after battle end:', error);
    }
  }

  // 방 목록을 모든 클라이언트에게 브로드캐스트
  private async broadcastRoomList(): Promise<void> {
    const rooms = await this.roomService.listRooms();
    const publicRooms = this.roomService.toPublicRooms(rooms);
    this.server.emit(SOCKET_EVENT.ROOM_LIST, publicRooms);
  }
}
