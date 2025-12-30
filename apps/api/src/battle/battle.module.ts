import { Module } from '@nestjs/common';

import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';

@Module({
  providers: [BattleService, BattleRedisService, BattleGateway],
  exports: [BattleService],
})
export class BattleModule {}
