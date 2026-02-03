import { Module } from '@nestjs/common';

import { PubSubModule } from '../pubsub/pubsub.module';
import { JudgeCacheService } from './judge.cache.service';
import { JudgeChecker } from './judge.checker';
import { JudgePoller } from './judge.poller';
import { JudgeReader } from './judge.reader';
import { JudgeService } from './judge.service';

@Module({
  imports: [PubSubModule],
  providers: [JudgeService, JudgeReader, JudgeChecker, JudgePoller, JudgeCacheService],
  exports: [JudgeService, JudgeCacheService],
})
export class JudgeModule {}
