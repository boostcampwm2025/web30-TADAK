import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { RoomModule } from '../room/room.module';
import { MatchingService } from './matching.service';
import { MatchingSchedulerService } from './matching-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Cron 기반 매칭 Tick을 위해 필요
    RoomModule, // Room & Battle 생성을 위해 필요
  ],
  providers: [
    MatchingService, // 매칭 로직 담당
    // MatchingGateway, // Socket 이벤트 처리
    MatchingSchedulerService, // Cron 기반 매칭 Tick 실행
  ],
  exports: [
    MatchingService, // 다른 모듈에서 사용 가능하도록 export
  ],
})
export class MatchingModule {}
