import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';

import { Problem } from '../problem/problem.entity';

type SubmissionJobType = 'TEST' | 'SUBMISSION';

@Injectable()
export class SubmissionFileService {
  private readonly logger = new Logger(SubmissionFileService.name);
  private readonly baseDir = '/judge-data';
  private readonly problemsDir = path.join(this.baseDir, 'problems');
  private readonly submissionsDir = path.join(this.baseDir, 'submissions');

  constructor(
    @InjectRepository(Problem)
    private problemRepository: Repository<Problem>,
  ) {}

  // 문제 데이터 파일 준비
  async prepareProblemData(problemId: string): Promise<void> {
    const problemDir = path.join(this.problemsDir, problemId);

    // 이미 파일이 있으면 건너뜀
    if (this.problemDataExists(problemId)) {
      this.logger.debug(`Problem data already exists for ${problemId}`);
      return;
    }

    // DB에서 문제 조회
    const problem = await this.problemRepository.findOne({ where: { id: problemId } });
    if (!problem) {
      throw new Error(`Problem not found in DB: ${problemId}`);
    }

    if (!fs.existsSync(problemDir)) {
      fs.mkdirSync(problemDir, { recursive: true });
      this.logger.log(`Created problem directory: ${problemDir}`);
    }

    const testJsonPath = path.join(problemDir, 'test.json');
    fs.writeFileSync(testJsonPath, JSON.stringify({ testCases: problem.examples }, null, 2));

    const submissionJsonPath = path.join(problemDir, 'submission.json');
    fs.writeFileSync(submissionJsonPath, JSON.stringify({ testCases: problem.testcases }, null, 2));
  }

  // 제출 데이터 파일 준비
  async prepareSubmissionData(
    submissionId: string,
    type: SubmissionJobType,
    problemId: string,
    code: string,
  ): Promise<void> {
    const submissionDir = path.join(this.submissionsDir, submissionId);

    // DB에서 Problem 조회
    const problem = await this.problemRepository.findOne({ where: { id: problemId } });
    if (!problem) {
      throw new Error(`Problem not found in DB: ${problemId}`);
    }

    if (!fs.existsSync(submissionDir)) {
      fs.mkdirSync(submissionDir, { recursive: true });
      this.logger.log(`Created submission directory: ${submissionDir}`);
    }

    const metadata = {
      problemId,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      type,
    };
    const metadataPath = path.join(submissionDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    const solutionPath = path.join(submissionDir, 'solution.js');
    fs.writeFileSync(solutionPath, code);
  }

  // 문제 데이터 존재 여부 확인
  problemDataExists(problemId: string): boolean {
    const problemDir = path.join(this.problemsDir, problemId);
    const testJsonPath = path.join(problemDir, 'test.json');
    const submissionJsonPath = path.join(problemDir, 'submission.json');

    return fs.existsSync(testJsonPath) && fs.existsSync(submissionJsonPath);
  }
}
