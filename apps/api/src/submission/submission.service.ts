import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import type { Repository } from 'typeorm';

import { CreateSubmissionDto } from './create-submission.dto';
import { Submission } from './submission.entity';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,

    @InjectQueue('submission-queue')
    private submissionQueue: Queue,
  ) {}

  async createSubmission(dto: CreateSubmissionDto, userId: string) {
    // DB에 저장
    const submission = this.submissionRepository.create({
      problemId: dto.problemId,
      code: dto.code,
      language: dto.language,
      userId,
      status: 'PENDING',
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // 큐에 작업 등록
    try {
      await this.submissionQueue.add('submission-job', {
        type: 'SUBMISSION',
        submissionId: savedSubmission.id,
        problemId: dto.problemId,
        code: dto.code,
        language: dto.language,
        userId,
      });
    } catch (error) {
      await this.submissionRepository.update(savedSubmission.id, {
        // 큐 등록 실패 시 DB 상태를 ERROR로 변경
        status: 'ERROR',
      });
      throw error;
    }

    return {
      submissionId: savedSubmission.id,
      status: 'PENDING',
      message: '채점이 시작되었습니다.',
    };
  }
}
