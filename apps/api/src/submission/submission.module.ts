import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubmissionController } from './submission.controller';
import { Submission } from './submission.entity';
import { SubmissionService } from './submission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission]),
    BullModule.registerQueue({
      name: 'submission-queue',
    }),
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule {}
