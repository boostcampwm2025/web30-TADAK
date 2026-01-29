import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BattleController } from '@/battle/battle.controller';
import { Battle } from '@/battle/battle.entity';
import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { MatchingModule } from '@/matching/matching.module';
import { ProblemModule } from '@/problem/problem.module';
import { RoomModule } from '@/room/room.module';
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Battle, Submission, User]),
    ProblemModule,
    UserModule,
    forwardRef(() => RoomModule),
    forwardRef(() => MatchingModule),
  ],
  controllers: [BattleController],
  providers: [BattleService, BattleRedisService, BattleGateway],
  exports: [BattleService, BattleGateway],
})
export class BattleModule {}
