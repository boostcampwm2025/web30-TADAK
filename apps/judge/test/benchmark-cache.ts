/* eslint-disable no-console */
import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import * as path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../../.env.dev') });

const REDIS_HOST =
  process.env.REDIS_HOST === 'redis' ? 'localhost' : process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

async function runBenchmark() {
  const connection = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
  });

  const submissionQueue = new Queue('submission-queue', { connection });

  const testPayload = {
    submissionId: `bench-${Date.now()}`,
    problemId: '1',
    code: `
      function solution() {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) sum += i;
        return sum;
      }
    `,
    language: 'javascript',
    type: 'SUBMISSION',
  };

  console.log('--- 🚀 채점 결과 캐싱 벤치마크 시작 ---');

  // 1. Cache Miss (최초 실행)
  console.log('\n[1] Cache Miss 테스트 (전체 채점 실행)');
  const start1 = Date.now();
  const job1 = await submissionQueue.add('submission', {
    ...testPayload,
    submissionId: `miss-${Date.now()}`,
  });
  console.log(`Job Miss 추가됨: ${job1.id}`);

  // 결과 대기 (실제 로깅은 서버 터미널에서 확인 권장)
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log(`소요 시간(예상): ${Date.now() - start1}ms (Docker 인스턴스 생성 및 실행 포함)`);

  // 2. Cache Hit (두 번째 실행)
  console.log('\n[2] Cache Hit 테스트 1');
  const start2 = Date.now();
  const job2 = await submissionQueue.add('submission', {
    ...testPayload,
    submissionId: `hit1-${Date.now()}`,
  });
  console.log(`Job Hit1 추가됨: ${job2.id}`);

  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`소요 시간(예상): ${Date.now() - start2}ms (캐시 데이터 즉시 반환)`);

  // 3. Cache Hit (세 번째 실행)
  console.log('\n[3] Cache Hit 테스트 2');
  const start3 = Date.now();
  const job3 = await submissionQueue.add('submission', {
    ...testPayload,
    submissionId: `hit2-${Date.now()}`,
  });
  console.log(`Job Hit2 추가됨: ${job3.id}`);

  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`소요 시간(예상): ${Date.now() - start3}ms (캐시 데이터 즉시 반환)`);

  console.log('\n--- ✅ 벤치마크 종료 ---');

  await connection.quit();
}

runBenchmark().catch(console.error);
