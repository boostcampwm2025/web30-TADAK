import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { SUBMISSION_QUEUE } from './submission.constants';
import { SubmissionProcessor } from './submission.processor';

@Module({
  imports: [BullModule.registerQueue({ name: SUBMISSION_QUEUE })],
  providers: [SubmissionProcessor],
})
export class SubmissionModule {}
