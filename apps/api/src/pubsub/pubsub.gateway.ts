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
  emitTestcaseUpdate(socketId: string, message: TestcaseUpdateMessage): void {
    this.server.to(socketId).emit('testcase-update', {
      submissionId: message.submissionId,
      testcase: message.testcase,
      progress: message.progress,
    });
    this.logger.debug(`Sent testcase-update to socket ${socketId}`);
  }

  // 방 전체에 최종 결과 브로드캐스트
  emitFinalResult(roomId: string, message: FinalResultMessage): void {
    this.server.to(roomId).emit('submission-result', {
      submissionId: message.submissionId,
      status: message.status,
      result: message.result,
    });
    this.logger.log(`Broadcast final-result to room ${roomId}`);
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
}
