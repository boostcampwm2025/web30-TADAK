import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { Metadata, OutputResult, SubmissionJobType, Testcase } from './judge.types';

@Injectable()
export class JudgeReader {
  private readonly DATA_DIR = process.env.JUDGE_VOLUME || '/judge-data';

  readMetadata(submissionId: string): Metadata {
    const submissionDir = this.getSubmissionDir(submissionId);
    const metaPath = path.join(submissionDir, 'meta.json');
    const legacyMetadataPath = path.join(submissionDir, 'metadata.json');
    const metadataPath = fs.existsSync(metaPath) ? metaPath : legacyMetadataPath;

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Metadata file not found for submission ${submissionId}`);
    }

    return JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as Metadata;
  }

  loadTestcases(problemId: string, type: SubmissionJobType): Testcase[] {
    const problemDir = path.join(this.DATA_DIR, 'problems', problemId.toString());
    const filename = type === 'TEST' ? 'test.json' : 'submission.json';
    const testcasePath = path.join(problemDir, filename);

    if (!fs.existsSync(testcasePath)) {
      throw new Error(`Testcase file not found for problem ${problemId}`);
    }

    const data = JSON.parse(fs.readFileSync(testcasePath, 'utf8')) as
      | Testcase[]
      | { testcases?: Testcase[]; testCases?: Testcase[] };
    const testcases = Array.isArray(data) ? data : (data.testcases ?? data.testCases);

    if (!Array.isArray(testcases)) {
      throw new Error(`Invalid testcase format for problem ${problemId}`);
    }

    return testcases;
  }

  hasOutputFile(submissionId: string, index: number): boolean {
    const submissionDir = this.getSubmissionDir(submissionId);
    const outputPath = path.join(submissionDir, `output_${index}.json`);
    return fs.existsSync(outputPath);
  }

  readOutputFile(submissionId: string, index: number): OutputResult {
    const submissionDir = this.getSubmissionDir(submissionId);
    const outputPath = path.join(submissionDir, `output_${index}.json`);
    return JSON.parse(fs.readFileSync(outputPath, 'utf8')) as OutputResult;
  }

  private getSubmissionDir(submissionId: string): string {
    return path.join(this.DATA_DIR, 'submissions', submissionId.toString());
  }
}
