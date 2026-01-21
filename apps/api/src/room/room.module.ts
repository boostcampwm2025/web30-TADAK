import { Module } from '@nestjs/common';

import { BattleModule } from '@/battle/battle.module';
import { ProblemModule } from '@/problem/problem.module';
import { UserModule } from '@/user/user.module';

import { RoomController } from './room.controller';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';

@Module({
  imports: [BattleModule, ProblemModule, UserModule],
  providers: [RoomService, RoomGateway],
  controllers: [RoomController],
  exports: [RoomService], // MatchingModule에서 사용할 수 있도록 export
})
export class RoomModule {}
