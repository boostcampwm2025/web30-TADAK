import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Battle } from '@/battle/battle.entity';
import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { ProblemModule } from '@/problem/problem.module';

@Module({
  imports: [TypeOrmModule.forFeature([Battle]), ProblemModule],
  providers: [BattleService, BattleRedisService, BattleGateway],
  exports: [BattleService, BattleGateway],
})
export class BattleModule {}
