import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DockerModule } from '../docker/docker.module';
import { SUBMISSION_QUEUE } from './submission.constants';
import { SubmissionProcessor } from './submission.processor';

@Module({
  imports: [BullModule.registerQueue({ name: SUBMISSION_QUEUE }), DockerModule],
  providers: [SubmissionProcessor],
})
export class SubmissionModule {}
