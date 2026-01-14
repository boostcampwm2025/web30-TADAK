import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { Metadata, Testcase } from './judge.types';

@Injectable()
export class JudgeReader {
  private readonly DATA_DIR = '/judge-data';

  // metadata.json 읽기
  readMetadata(submissionId: number): Metadata {
    const submissionDir = path.join(this.DATA_DIR, 'submissions', submissionId.toString());
    const metadataPath = path.join(submissionDir, 'metadata.json');
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as Metadata;
  }

  // 테스트케이스 로드 (test.json 또는 submission.json)
  loadTestcases(problemId: number, type: 'TEST' | 'SUBMISSION'): Testcase[] {
    const problemDir = path.join(this.DATA_DIR, 'problems', problemId.toString());
    const filename = type === 'TEST' ? 'test.json' : 'submission.json';
    const testcasePath = path.join(problemDir, filename);

    const data = JSON.parse(fs.readFileSync(testcasePath, 'utf8')) as
      | { testcases: Testcase[] }
      | Testcase[];
    return Array.isArray(data) ? data : data.testcases;
  }

  // output 파일 존재 여부 확인
  hasOutputFile(submissionId: number, index: number): boolean {
    const submissionDir = path.join(this.DATA_DIR, 'submissions', submissionId.toString());
    const outputPath = path.join(submissionDir, `output_${index}.txt`);
    return fs.existsSync(outputPath);
  }

  // output 파일 읽기
  readOutputFile(submissionId: number, index: number): string {
    const submissionDir = path.join(this.DATA_DIR, 'submissions', submissionId.toString());
    const outputPath = path.join(submissionDir, `output_${index}.txt`);
    return fs.readFileSync(outputPath, 'utf8');
  }
}
