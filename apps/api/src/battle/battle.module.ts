import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BattleController } from '@/battle/battle.controller';
import { Battle } from '@/battle/battle.entity';
import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { ProblemModule } from '@/problem/problem.module';
import { RoomModule } from '@/room/room.module';
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Battle, Submission, User]),
    ProblemModule,
    forwardRef(() => RoomModule),
  ],
  controllers: [BattleController],
  providers: [BattleService, BattleRedisService, BattleGateway],
  exports: [BattleService, BattleGateway],
})
export class BattleModule {}
