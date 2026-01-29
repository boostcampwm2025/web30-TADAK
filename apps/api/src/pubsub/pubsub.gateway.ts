import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SOCKET_NAMESPACE } from '@packages/constants/socket-event';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@packages/types/pubsub';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: SOCKET_NAMESPACE.GAME })
export class PubsubGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(PubsubGateway.name);

  // 특정 소켓에 테스트케이스 결과 전달
  emitTestcaseUpdate(
    socketId: string,
    message: TestcaseUpdateMessage,
    test: boolean = false,
  ): void {
    const payload: Partial<TestcaseUpdateMessage> = {
      submissionId: message.submissionId,
      testcase: message.testcase,
      progress: message.progress,
    };

    // 테스트일 때만 입출력 결과 포함
    if (test && message.results) {
      payload.results = message.results;
    }

    this.server.to(socketId).emit('testcase-update', payload);

    // this.logger.debug(`Sent testcase-update to socket ${socketId}`);
  }

  // 방 전체에 최종 결과 브로드캐스트
  emitFinalResult(roomId: string, message: FinalResultMessage, userId?: string): void {
    this.server.to(roomId).emit('submission-result', {
      submissionId: message.submissionId,
      status: message.status,
      result: message.result,
      userId,
    });
    this.logger.log(`Broadcast final-result to room ${roomId} for user ${userId}`);
  }

  // 특정 소켓에 최종 결과 전달 (테스트 실행 등)
  emitFinalResultToSocket(socketId: string, message: FinalResultMessage): void {
    this.server.to(socketId).emit('submission-result', {
      submissionId: message.submissionId,
      status: message.status,
      result: message.result,
    });
    this.logger.log(`Sent final-result to socket ${socketId}`);
  }

  // 방 전체에 테스트 실행 결과 브로드캐스트
  emitTestResult(roomId: string, message: FinalResultMessage, userId: string): void {
    this.server.to(roomId).emit('test-result', {
      submissionId: message.submissionId,
      status: message.status,
      result: message.result,
      userId,
    });
    this.logger.log(`Broadcast test-result to room ${roomId} for user ${userId}`);
  }

  // 방 전체에 시스템 채팅 메시지 전송
  emitSystemChat(roomId: string, message: string): void {
    this.server.to(roomId).emit('receive-chat', {
      type: 'SYSTEM',
      nickname: '시스템',
      message,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Broadcast system chat to room ${roomId}: ${message}`);
  }
}
