import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DockerModule } from '../docker/docker.module';
import { JudgeModule } from '../judge/judge.module';
import { Problem } from '../problem/problem.entity';
import { SUBMISSION_QUEUE } from './submission.constants';
import { SubmissionProcessor } from './submission.processor';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SUBMISSION_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { age: 3600, count: 50 },
      },
    }),
    DockerModule,
    JudgeModule,
    TypeOrmModule.forFeature([Problem]),
  ],
  providers: [SubmissionProcessor, SubmissionService],
})
export class SubmissionModule {}
