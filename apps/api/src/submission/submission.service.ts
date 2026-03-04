import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubmissionDetail } from '@packages/types/submission';
import type { Queue } from 'bullmq';
import type { Repository } from 'typeorm';

import { Problem } from '@/problem/problem.entity';

import { CreateSubmissionDto } from './create-submission.dto';
import { Submission } from './submission.entity';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Problem)
    private problemRepository: Repository<Problem>,

    @InjectQueue('submission-queue')
    private submissionQueue: Queue,
  ) {}

  async getSubmissionDetail(
    submissionId: string,
    userId: string,
  ): Promise<SubmissionDetail | null> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, userId },
    });

    if (!submission) {
      return null;
    }

    const problem = await this.problemRepository.findOne({
      where: { id: submission.problemId },
    });

    if (!problem) {
      return null;
    }

    return {
      id: submission.id,
      code: submission.code,
      language: submission.language,
      problem: {
        title: problem.title,
        source: problem.source,
        difficulty: problem.difficulty,
        tags: problem.tags,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        statement: problem.statement,
        input: problem.input,
        output: problem.output,
        examples: problem.examples,
      },
    };
  }

  async submit(dto: CreateSubmissionDto, userId: string, socketId: string) {
    // DB에 저장
    const submission = this.submissionRepository.create({
      problemId: dto.problemId,
      code: dto.code,
      language: dto.language,
      userId,
      battleId: dto.battleId,
      status: 'PENDING',
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // 큐에 작업 등록
    try {
      await this.submissionQueue.add(
        'submission-job',
        {
          type: 'SUBMISSION',
          submissionId: String(savedSubmission.id),
          problemId: dto.problemId,
          code: dto.code,
          language: dto.language,
          userId,
          battleId: dto.battleId,
          socketId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: { age: 3600, count: 50 },
        },
      );
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
    };
  }

  async executeTest(dto: CreateSubmissionDto, userId: string, socketId: string) {
    // 테스트용 submissionId 생성
    const testSubmissionId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 큐에 작업 등록
    await this.submissionQueue.add(
      'test-job',
      {
        type: 'TEST',
        submissionId: testSubmissionId,
        problemId: dto.problemId,
        code: dto.code,
        language: dto.language,
        userId,
        socketId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: { age: 3600, count: 50 },
      },
    );
  }
}
