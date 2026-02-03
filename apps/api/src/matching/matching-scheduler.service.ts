import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MatchingGateway } from './matching.gateway';
import { MatchingService } from './matching.service';

@Injectable()
export class MatchingSchedulerService {
  private readonly logger = new Logger(MatchingSchedulerService.name);

  // Tick 재진입 방지 플래그
  private isMatchingInProgress = false;

  constructor(
    private readonly matchingService: MatchingService,
    private readonly matchingGateway: MatchingGateway,
  ) {}

  // 2초마다 매칭 Tick 실행
  @Cron('*/2 * * * * *')
  async handleMatchingTick() {
    // 이전 Tick이 아직 실행 중이면 스킵
    if (this.isMatchingInProgress) {
      this.logger.warn('[MatchingTick] 이전 Tick 실행 중 - 스킵');
      return;
    }

    this.isMatchingInProgress = true;
    try {
      const matchedUsers = await this.matchingService.matchUsers();

      if (matchedUsers.length > 0) {
        this.logger.log(`매칭 성공: ${matchedUsers.length / 2}쌍 (${matchedUsers.length}명)`);
      }

      // 타임아웃 유저 처리
      await this.matchingService.findTimeoutUsers();
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(`매칭 Tick 에러: ${error.message}`);
    } finally {
      this.isMatchingInProgress = false;
    }
  }

  // 5초마다 매칭 통계 전송
  @Cron('*/5 * * * * *')
  async handleStatsUpdate() {
    try {
      const stats = await this.matchingService.getMatchingStats();
      const socketIds = await this.matchingService.getMatchingQueueSocketIds();
      this.matchingGateway.broadcastMatchingStats(stats, socketIds);
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(`통계 업데이트 에러: ${error.message}`);
    }
  }
}
