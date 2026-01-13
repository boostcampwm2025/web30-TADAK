import { Module } from '@nestjs/common';

import { BattleModule } from '@/battle/battle.module';

import { RoomController } from './room.controller';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';

@Module({
  imports: [BattleModule],
  providers: [RoomService, RoomGateway],
  controllers: [RoomController],
  exports: [RoomService], // MatchingModule에서 사용할 수 있도록 export
})
export class RoomModule {}
