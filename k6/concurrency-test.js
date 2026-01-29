import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, CODE_SAMPLES } from './config.js';

// 커스텀 메트릭
const submissionSuccessRate = new Rate('submission_success_rate');
const submissionDuration = new Trend('submission_duration');
const queuedSubmissions = new Counter('queued_submissions');

/**
 * 동시성 테스트 설정
 *
 * BullMQ concurrency=5 설정 검증:
 * - 동시에 50개 요청을 보내서 큐 처리 확인
 * - 5개씩 처리되는지 응답 시간으로 간접 확인
 */
export const options = {
  scenarios: {
    // 시나리오 1: 동시에 50개 요청
    burst_test: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<60000'], // 큐 대기 포함 60초 이내
    http_req_failed: ['rate<0.1'],
  },
};

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CONFIG.JWT_TOKEN}`,
    'x-socket-id': `${CONFIG.SOCKET_ID}-concurrent-${__VU}-${__ITER}`,
  };
}

function submitCode(code) {
  const startTime = Date.now();

  const payload = JSON.stringify({
    problemId: CONFIG.PROBLEM_ID,
    code: code,
    language: 'javascript',
  });

  const response = http.post(`${CONFIG.BASE_URL}/api/submissions`, payload, {
    headers: getHeaders(),
    timeout: '120s',
  });

  const endTime = Date.now();

  console.log(
    `VU ${__VU}: Submitted at ${new Date(startTime).toISOString()}, ` +
      `Response at ${new Date(endTime).toISOString()}, ` +
      `Duration: ${endTime - startTime}ms, Status: ${response.status}`,
  );

  return response;
}

export default function () {
  const response = submitCode(CODE_SAMPLES.javascript.correct);

  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has submissionId': (r) => {
      try {
        return JSON.parse(r.body).submissionId !== undefined;
      } catch {
        return false;
      }
    },
  });

  submissionSuccessRate.add(success);
  submissionDuration.add(response.timings.duration);
  queuedSubmissions.add(1);
}

export function setup() {
  console.log('========================================');
  console.log('동시성 테스트 (Concurrency Test)');
  console.log('설정: 50개 요청 동시 전송');
  console.log('예상: BullMQ가 5개씩 처리');
  console.log('========================================');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('========================================');
  console.log(`동시성 테스트 완료: ${duration.toFixed(2)}초`);
  console.log('');
  console.log('결과 분석 방법:');
  console.log('- 50개 요청이 5개씩 처리되면');
  console.log('- 약 10개 배치 × 채점시간 만큼 소요');
  console.log('- 응답 시간 분포를 확인하세요');
  console.log('========================================');
}
