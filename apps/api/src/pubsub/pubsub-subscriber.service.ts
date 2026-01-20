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

    const socketId =
      (message.socketId as string) ?? (await this.getSocketIdBySubmissionId(message.submissionId));

    // DB에서 submission 조회하여 타입 판별 (DB에 있으면 SUBMISSION, 없으면 TEST)
    const submission = await this.submissionRepository.findOne({
      where: { id: message.submissionId },
    });
    if (socketId && !submission) {
      // TEST 타입 : 입출력 결과 전송
      this.pubsubGateway.emitTestcaseUpdate(socketId, message, true);
      return;
    }

    if (socketId && submission) {
      // SUBMISSION 타입 : 입출력 결과 미전송
      this.pubsubGateway.emitTestcaseUpdate(socketId, message);
    }
  }

  private async handleFinalResult(message: FinalResultMessage) {
    this.logger.log(
      `[FINAL_RESULT] Submission ${message.submissionId}: ${message.status} (${message.result.passed}/${message.result.total})`,
    );

    // DB에서 submission 조회하여 타입 판별 (DB에 있으면 SUBMISSION, 없으면 TEST)
    const submission = await this.submissionRepository.findOne({
      where: { id: message.submissionId },
    });

    // TEST 타입 (DryRun)
    if (!submission && message.socketId) {
      this.logger.log(`[FINAL_RESULT] Sending to socket ${message.socketId} (TEST type)`);
      this.pubsubGateway.emitFinalResult(message.socketId, message);
      return;
    }

    // SUBMISSION 타입: DB 업데이트
    if (submission) {
      try {
        await this.submissionRepository.update(message.submissionId, {
          status: message.status,
          passedTestCases: message.result.passed,
          totalTestCases: message.result.total,
          executionTime: message.result.time,
          memoryUsed: message.result.memory,
        });
        this.logger.log(`[FINAL_RESULT] DB updated for submission ${message.submissionId}`);
      } catch (error) {
        this.logger.error(
          `[FINAL_RESULT] Failed to update DB for submission ${message.submissionId}`,
          error,
        );
      }

      // SUBMISSION 타입: roomId로 브로드캐스트
      const userInfo = await this.getUserInfoBySubmissionId(message.submissionId);

      if (userInfo?.roomId) {
        this.pubsubGateway.emitFinalResult(userInfo.roomId, message, userInfo.userId);
        this.battleGateway.handleUserFinished({
          roomId: userInfo.roomId,
          userId: userInfo.userId,
          username: userInfo.username,
        });
      }
    }
  }

  private async getSubmissionType(submissionId: string): Promise<'TEST' | 'SUBMISSION' | null> {
    const fs = await import('fs');
    const path = await import('path');

    const metaPath = path.join('/judge-data/submissions', submissionId, 'meta.json');

    try {
      if (!fs.existsSync(metaPath)) {
        this.logger.warn(`[getSubmissionType] meta.json not found for ${submissionId}`);
        return null;
      }

      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(metaContent) as { type: 'TEST' | 'SUBMISSION' };

      return meta.type;
    } catch (error) {
      this.logger.error(`[getSubmissionType] Failed to read meta.json for ${submissionId}`, error);
      return null;
    }
  }

  private async getSocketIdBySubmissionId(submissionId: string): Promise<string | null> {
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
    submissionId: string,
  ): Promise<{ roomId: string; userId: string; username: string } | null> {
    const numericId = this.toNumericSubmissionId(submissionId);
    if (numericId === null) {
      return null;
    }
    const submission = await this.submissionRepository.findOne({
      where: { id: String(numericId) },
    });
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

  private toNumericSubmissionId(value: number | string): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
}
