import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Problem } from '@/problem/problem.entity';

import { SubmissionController } from './submission.controller';
import { Submission } from './submission.entity';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Problem]),
    BullModule.registerQueue({
      name: 'submission-queue',
    }),
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule {}
