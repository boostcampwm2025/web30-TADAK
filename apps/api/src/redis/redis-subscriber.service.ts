import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PUBSUB_CHANNELS } from '@packages/constants/pubsub';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@packages/types/pubsub';
import Redis from 'ioredis';

@Injectable()
export class RedisSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(RedisSubscriberService.name);
  private readonly subscriber: Redis;

  constructor(private readonly configService: ConfigService) {
    this.subscriber = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
    });
  }

  async onModuleInit() {
    await this.subscriber.subscribe(PUBSUB_CHANNELS.SUBMISSION_RESULT);
    this.logger.log(`Subscribed to channel: ${PUBSUB_CHANNELS.SUBMISSION_RESULT}`);

    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });
  }

  private handleMessage(channel: string, message: string) {
    try {
      const parsedMessage = JSON.parse(message) as TestcaseUpdateMessage | FinalResultMessage;

      if (parsedMessage.type === 'TESTCASE_UPDATE') {
        this.handleTestcaseUpdate(parsedMessage);
      } else if (parsedMessage.type === 'FINAL_RESULT') {
        this.handleFinalResult(parsedMessage);
      }
    } catch (error) {
      this.logger.error(`Failed to parse message from channel ${channel}:`, error);
    }
  }

  private handleTestcaseUpdate(message: TestcaseUpdateMessage) {
    this.logger.log(
      `[TESTCASE_UPDATE] Submission ${message.submissionId} - TC ${message.testcase.index}: ${message.testcase.status}`,
    );
    // TODO: WebSocket으로 클라이언트에 전달
  }

  private handleFinalResult(message: FinalResultMessage) {
    this.logger.log(
      `[FINAL_RESULT] Submission ${message.submissionId}: ${message.status} (${message.result.passed}/${message.result.total})`,
    );
    // TODO: WebSocket으로 클라이언트에 전달
  }
}
