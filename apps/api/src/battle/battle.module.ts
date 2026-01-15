import { Module } from '@nestjs/common';

import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { ProblemModule } from '@/problem/problem.module';

@Module({
  imports: [ProblemModule],
  providers: [BattleService, BattleRedisService, BattleGateway],
  exports: [BattleService, BattleGateway],
})
export class BattleModule {}
