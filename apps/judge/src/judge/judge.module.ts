import { Module } from '@nestjs/common';

import { PubSubModule } from '../pubsub/pubsub.module';
import { JudgeService } from './judge.service';

@Module({
  imports: [PubSubModule],
  providers: [JudgeService],
  exports: [JudgeService],
})
export class JudgeModule {}
