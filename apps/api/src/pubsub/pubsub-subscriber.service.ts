import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PUBSUB_CHANNELS } from '@packages/constants/pubsub';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@packages/types/pubsub';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { BattleGateway } from '../battle/battle.gateway';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';
import { Submission } from '../submission/submission.entity';
import { PubsubGateway } from './pubsub.gateway';

@Injectable()
export class PubsubSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(PubsubSubscriberService.name);
  private readonly subscriber: Redis;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @InjectRepository(Submission) private readonly submissionRepository: Repository<Submission>,
    private readonly pubsubGateway: PubsubGateway,
    @Inject(forwardRef(() => BattleGateway)) private readonly battleGateway: BattleGateway,
  ) {
    this.subscriber = this.redisClient.duplicate();
  }

  async onModuleInit() {
    await this.subscriber.subscribe(PUBSUB_CHANNELS.SUBMISSION_RESULT);
    this.logger.log(`Subscribed to channel: ${PUBSUB_CHANNELS.SUBMISSION_RESULT}`);

    this.subscriber.on('message', (channel, message) => {
      void this.handleMessage(channel, message);
    });
  }

  private async handleMessage(channel: string, message: string) {
    try {
      const parsedMessage = JSON.parse(message) as TestcaseUpdateMessage | FinalResultMessage;

      if (parsedMessage.type === 'TESTCASE_UPDATE') {
        await this.handleTestcaseUpdate(parsedMessage);
      } else if (parsedMessage.type === 'FINAL_RESULT') {
        await this.handleFinalResult(parsedMessage);
      }
    } catch (error) {
      this.logger.error(`Failed to parse message from channel ${channel}:`, error);
    }
  }

  private async handleTestcaseUpdate(message: TestcaseUpdateMessage) {
    this.logger.log(
      `[TESTCASE_UPDATE] Submission ${message.submissionId} - TC ${message.testcase.index}: ${message.testcase.status}`,
    );

    const socketId = await this.getSocketIdBySubmissionId(message.submissionId);
    if (socketId) {
      this.pubsubGateway.emitTestcaseUpdate(socketId, message);
    }
  }

  private async handleFinalResult(message: FinalResultMessage) {
    this.logger.log(
      `[FINAL_RESULT] Submission ${message.submissionId}: ${message.status} (${message.result.passed}/${message.result.total})`,
    );

    const userInfo = await this.getUserInfoBySubmissionId(message.submissionId);

    if (userInfo?.roomId) {
      this.pubsubGateway.emitFinalResult(userInfo.roomId, message);
      this.battleGateway.handleUserFinished({
        roomId: userInfo.roomId,
        userId: userInfo.userId,
        username: userInfo.username,
      });
    }
  }

  private async getSocketIdBySubmissionId(submissionId: number): Promise<string | null> {
    const submission = await this.submissionRepository.findOne({ where: { id: submissionId } });
    if (!submission) {
      this.logger.warn(`Submission ${submissionId} not found`);
      return null;
    }

    const socketId = await this.redisClient.hget(
      RedisKeys.matchingUser(submission.userId),
      'socketId',
    );
    if (!socketId) {
      this.logger.warn(`SocketId not found for user ${submission.userId}`);
      return null;
    }

    return socketId;
  }

  // submissionId로 유저 정보 조회 (roomId, username)
  private async getUserInfoBySubmissionId(
    submissionId: number,
  ): Promise<{ roomId: string; userId: string; username: string } | null> {
    const submission = await this.submissionRepository.findOne({ where: { id: submissionId } });
    if (!submission) {
      this.logger.warn(`Submission ${submissionId} not found`);
      return null;
    }

    const userData = await this.redisClient.hgetall(RedisKeys.matchingUser(submission.userId));
    if (!userData?.roomId) {
      this.logger.warn(`RoomId not found for user ${submission.userId}`);
      return null;
    }

    return {
      roomId: userData.roomId,
      userId: submission.userId,
      username: userData.username ?? '플레이어',
    };
  }
}
