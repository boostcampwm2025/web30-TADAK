import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MatchingService } from './matching.service';

@Injectable()
export class MatchingSchedulerService {
  private readonly logger = new Logger(MatchingSchedulerService.name);

  constructor(private readonly matchingService: MatchingService) {}

  // 2초마다 매칭 Tick 실행
  @Cron('*/2 * * * * *')
  async handleMatchingTick() {
    try {
      // TODO: LOCK 구현 필요(TTL < TICK)
      const matchedUsers = await this.matchingService.matchUsers();

      if (matchedUsers.length > 0) {
        this.logger.log(`매칭 성공: ${matchedUsers.length / 2}쌍 (${matchedUsers.length}명)`);
      }

      // 타임아웃 유저 처리
      await this.matchingService.findTimeoutUsers();
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(`매칭 Tick 에러: ${error.message}`);
    }
  }
}
