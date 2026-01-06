import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MatchingSchedulerService {
  private readonly logger = new Logger(MatchingSchedulerService.name);

  // constructor(private readonly matchingService: MatchingService) {}

  // 5초마다 매칭 Tick 실행
  @Cron(CronExpression.EVERY_5_SECONDS)
  handleMatchingTick() {
    this.logger.log('매칭 Tick 실행 - 5초마다 동작');
  }

  // 10초마다 타임아웃 체크
  @Cron(CronExpression.EVERY_10_SECONDS)
  handleTimeoutCheck() {
    this.logger.log('타임아웃 체크 실행 - 10초마다 동작');
  }
}
