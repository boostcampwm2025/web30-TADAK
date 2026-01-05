import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MatchingService } from './matching.service';

@Injectable()
export class MatchingSchedulerService {
  private readonly logger = new Logger(MatchingSchedulerService.name);

  constructor(private readonly matchingService: MatchingService) {}

  // 5초마다 매칭 Tick 실행
  @Cron(CronExpression.EVERY_5_SECONDS)
  handleMatchingTick() {
    try {
      // TODO: LOCK 구현 필요(TTL < TICK)
      this.logger.log('매칭 Tick 시작');
      this.matchingService.matchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(`매칭 Tick 에러: ${error.message}`);
    }
  }
}
