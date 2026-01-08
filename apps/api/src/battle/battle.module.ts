import { Module } from '@nestjs/common';

import { BattleController } from '@/battle/battle.controller';
import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';

@Module({
  controllers: [BattleController],
  providers: [BattleService, BattleRedisService, BattleGateway],
  exports: [BattleService],
})
export class BattleModule {}
