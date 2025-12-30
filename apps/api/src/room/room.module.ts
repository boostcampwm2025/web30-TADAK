import { Module } from '@nestjs/common';

import { BattleModule } from '@/battle/battle.module';

import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';

@Module({
  imports: [BattleModule],
  providers: [RoomService, RoomGateway],
})
export class RoomModule {}
