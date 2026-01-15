import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { Metadata, OutputResult, SubmissionJobType, Testcase } from './judge.types';

@Injectable()
export class JudgeReader {
  private readonly DATA_DIR = process.env.JUDGE_VOLUME || '/judge-data';

  readMetadata(submissionId: number): Metadata {
    const submissionDir = this.getSubmissionDir(submissionId);
    const metadataPath = path.join(submissionDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Metadata file not found for submission ${submissionId}`);
    }

    return JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as Metadata;
  }

  loadTestcases(problemId: number, type: SubmissionJobType): Testcase[] {
    const problemDir = path.join(this.DATA_DIR, 'problems', problemId.toString());
    const filename = type === 'TEST' ? 'test.json' : 'submission.json';
    const testcasePath = path.join(problemDir, filename);

    if (!fs.existsSync(testcasePath)) {
      throw new Error(`Testcase file not found for problem ${problemId}`);
    }

    const data = JSON.parse(fs.readFileSync(testcasePath, 'utf8')) as { testcases: Testcase[] };
    return Array.isArray(data) ? data : data.testcases;
  }

  hasOutputFile(submissionId: number, index: number): boolean {
    const submissionDir = this.getSubmissionDir(submissionId);
    const outputPath = path.join(submissionDir, `output_${index}.json`);
    return fs.existsSync(outputPath);
  }

  readOutputFile(submissionId: number, index: number): OutputResult {
    const submissionDir = this.getSubmissionDir(submissionId);
    const outputPath = path.join(submissionDir, `output_${index}.json`);
    return JSON.parse(fs.readFileSync(outputPath, 'utf8')) as OutputResult;
  }

  private getSubmissionDir(submissionId: number): string {
    return path.join(this.DATA_DIR, 'submissions', submissionId.toString());
  }
}
