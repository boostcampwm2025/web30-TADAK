import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { TestcaseStatus } from '../../../../packages/types/pubsub';
import { PubsubService } from '../pubsub/pubsub.service';

interface Metadata {
  problemId: number;
  timeLimit: number;
  memoryLimit: number;
  type: 'TEST' | 'SUBMISSION';
}

interface Testcase {
  id: number;
  input: string;
  output: string;
}

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);
  private readonly DATA_DIR = '/judge-data';
  private readonly POLL_INTERVAL = 300; // 0.3초

  constructor(private readonly pubsubService: PubsubService) {}

  // 폴링 방식 채점 (0.3초마다 output 파일 체크)
  async judgeSubmission(submissionId: number) {
    try {
      const submissionDir = path.join(this.DATA_DIR, 'submissions', submissionId.toString());

      // 1. metadata.json 읽기
      const metadata = this.readMetadata(submissionDir);

      // 2. 테스트케이스 로드
      const testcases = this.loadTestcases(metadata.problemId, metadata.type);

      // 3. 폴링 시작
      let lastProcessedIndex = -1;
      let passed = 0;
      let finalStatus: TestcaseStatus = 'ACCEPTED';
      let maxTime = 0;
      let maxMemory = 0;

      this.logger.log(`Starting to poll output files for submission ${submissionId}`);

      while (true) {
        // 새로운 output 파일 체크
        for (let i = lastProcessedIndex + 1; i < testcases.length; i++) {
          const outputPath = path.join(submissionDir, `output_${i}.txt`);

          // output 파일이 생성되었는지 확인
          if (!fs.existsSync(outputPath)) {
            // 아직 생성 안 됨 - 다음 폴링까지 대기
            break;
          }

          const testcase = testcases[i];
          const actualOutput = fs.readFileSync(outputPath, 'utf8');

          // 출력 비교
          const isCorrect = this.compareOutput(actualOutput, testcase.output);
          const tcStatus: TestcaseStatus = isCorrect ? 'ACCEPTED' : 'WRONG_ANSWER';

          // TODO: time, memory는 추후 Docker 컨테이너에서 측정
          const time = 0;
          const memory = 0;

          // 진행 상황 발행 (각 테스트케이스마다)
          await this.pubsubService.publishTestcaseUpdate({
            type: 'TESTCASE_UPDATE',
            submissionId,
            testcase: {
              index: i + 1,
              status: tcStatus,
              time,
              memory,
            },
            progress: {
              completed: i + 1,
              passed: isCorrect ? passed + 1 : passed,
              total: testcases.length,
            },
          });

          // 통계 계산
          maxTime = Math.max(maxTime, time);
          maxMemory = Math.max(maxMemory, memory);

          if (tcStatus === 'ACCEPTED') {
            passed++;
          } else {
            finalStatus = tcStatus;
            // WA 나와도 계속 채점 (프론트에 보여주기 위해)
          }

          lastProcessedIndex = i;
        }

        // 모든 테스트케이스 완료?
        if (lastProcessedIndex === testcases.length - 1) {
          this.logger.log(`All testcases completed for submission ${submissionId}`);
          break;
        }

        // 컨테이너 종료 확인 (done.txt 같은 signal 파일)
        if (this.isContainerFinished(submissionDir)) {
          this.logger.log(`Container finished for submission ${submissionId}`);
          break;
        }

        // 0.3초 대기
        await this.sleep(this.POLL_INTERVAL);
      }

      // 4. 최종 결과 발행
      await this.pubsubService.publishFinalResult({
        type: 'FINAL_RESULT',
        submissionId,
        status: finalStatus,
        result: {
          passed,
          total: testcases.length,
          time: maxTime,
          memory: maxMemory,
        },
      });

      this.logger.log(
        `Judging completed for submission ${submissionId}: ${finalStatus} (${passed}/${testcases.length})`,
      );
    } catch (error) {
      this.logger.error(`Failed to judge submission ${submissionId}`, error);
      throw error;
    }
  }

  private readMetadata(submissionDir: string): Metadata {
    const metadataPath = path.join(submissionDir, 'metadata.json');
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as Metadata;
  }

  private loadTestcases(problemId: number, type: 'TEST' | 'SUBMISSION'): Testcase[] {
    const problemDir = path.join(this.DATA_DIR, 'problems', problemId.toString());
    const filename = type === 'TEST' ? 'test.json' : 'submission.json';
    const testcasePath = path.join(problemDir, filename);

    const data = JSON.parse(fs.readFileSync(testcasePath, 'utf8')) as
      | { testcases: Testcase[] }
      | Testcase[];
    return Array.isArray(data) ? data : data.testcases;
  }

  // 컨테이너 종료 확인
  private isContainerFinished(submissionDir: string): boolean {
    const donePath = path.join(submissionDir, 'done.txt');
    return fs.existsSync(donePath);
  }

  // 출력 비교
  private compareOutput(actual: string, expected: string): boolean {
    const normalize = (str: string) =>
      str
        .trim()
        .replace(/\r\n/g, '\n') // Windows 개행 → Unix 개행
        .replace(/\r/g, '\n'); // Old Mac 개행 → Unix 개행

    return normalize(actual) === normalize(expected);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
