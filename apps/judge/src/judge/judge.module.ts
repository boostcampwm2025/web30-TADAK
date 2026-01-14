import { Module } from '@nestjs/common';

import { PubSubModule } from '../pubsub/pubsub.module';
import { JudgeChecker } from './judge.checker';
import { JudgePoller } from './judge.poller';
import { JudgeReader } from './judge.reader';
import { JudgeService } from './judge.service';

@Module({
  imports: [PubSubModule],
  providers: [JudgeService, JudgeReader, JudgeChecker, JudgePoller],
  exports: [JudgeService],
})
export class JudgeModule {}
