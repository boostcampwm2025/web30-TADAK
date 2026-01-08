import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MatchingGateway } from './matching.gateway';
import { MatchingService } from './matching.service';

@Injectable()
export class MatchingSchedulerService {
  private readonly logger = new Logger(MatchingSchedulerService.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly matchingGateway: MatchingGateway,
  ) {}

  // 2초마다 매칭 Tick 실행
  @Cron('*/2 * * * * *')
  async handleMatchingTick() {
    try {
      // TODO: LOCK 구현 필요(TTL < TICK)
      const matchedUsers = await this.matchingService.matchUsers();

      if (matchedUsers.length > 0) {
        this.logger.log(`매칭 성공: ${matchedUsers.length / 2}쌍 (${matchedUsers.length}명)`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(`매칭 Tick 에러: ${error.message}`);
    }
  }

  // 5초마다 매칭 통계 전송
  @Cron('*/5 * * * * *')
  async handleStatsUpdate() {
    try {
      const stats = await this.matchingService.getMatchingStats();
      const socketIds = await this.matchingService.getMatchingQueueSocketIds();
      this.matchingGateway.broadcastMatchingStats(stats, socketIds);
      this.logger.debug(
        `매칭 통계 전송: ${stats.waitingPlayers}명 대기, ${stats.ongoingBattles}개 진행 중, 평균 ${stats.avgMatchTime}초`,
      );
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(`통계 업데이트 에러: ${error.message}`);
    }
  }
}
