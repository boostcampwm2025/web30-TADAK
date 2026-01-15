import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DockerModule } from '../docker/docker.module';
import { Problem } from '../problem/problem.entity';
import { SUBMISSION_QUEUE } from './submission.constants';
import { SubmissionProcessor } from './submission.processor';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: SUBMISSION_QUEUE }),
    DockerModule,
    TypeOrmModule.forFeature([Problem]),
  ],
  providers: [SubmissionProcessor, SubmissionService],
})
export class SubmissionModule {}
