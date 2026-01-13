import { Inject, Injectable, Logger } from '@nestjs/common';
import { PUBSUB_CHANNELS } from '@packages/constants/pubsub';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@packages/types/pubsub';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '@/redis/redis.module';

@Injectable()
export class PubsubService {
  private readonly logger = new Logger(PubsubService.name);
  private readonly CHANNEL = PUBSUB_CHANNELS.SUBMISSION_RESULT;

  constructor(@Inject(REDIS_CLIENT) private readonly redisPublisher: Redis) {}

  async publishTestcaseUpdate(message: TestcaseUpdateMessage): Promise<void> {
    try {
      const payload = JSON.stringify(message);
      await this.redisPublisher.publish(this.CHANNEL, payload);
      this.logger.log(
        `Published TESTCASE_UPDATE for submission ${message.submissionId}: TC#${message.testcase.index} ${message.testcase.status} (${message.progress.completed}/${message.progress.total})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish testcase update for submission ${message.submissionId}`,
        error,
      );
      throw error;
    }
  }

  async publishFinalResult(message: FinalResultMessage): Promise<void> {
    try {
      const payload = JSON.stringify(message);
      await this.redisPublisher.publish(this.CHANNEL, payload);
      this.logger.log(
        `Published FINAL_RESULT for submission ${message.submissionId}: ${message.status} (${message.result.passed}/${message.result.total})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish final result for submission ${message.submissionId}`,
        error,
      );
      throw error;
    }
  }
}
