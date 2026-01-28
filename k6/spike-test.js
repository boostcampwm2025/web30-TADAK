import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, CODE_SAMPLES } from './config.js';

const submissionSuccessRate = new Rate('submission_success_rate');
const submissionDuration = new Trend('submission_duration');
const totalSubmissions = new Counter('total_submissions');

export const options = {
  stages: [
    // 1. 준비 단계: 10초 동안 10명까지 완만하게 상승
    { duration: '10s', target: 10 },
    // 2. 스파이크 발생!!: 5초 만에 100명으로 급증
    { duration: '5s', target: 100 },
    // 3. 유지: 100명이 30초 동안 집중적으로 제출 (여기서 약 1,500~1,800개 발생)
    { duration: '30s', target: 100 },
    // 4. 감소: 10초 동안 다시 10명으로 감소
    { duration: '10s', target: 10 },
    // 5. 마무리: 15초 동안 잔여 작업 확인 후 종료
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 응답 10초 이내
    http_req_failed: ['rate<0.1'], // 실패율 10% 미만
  },
};

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CONFIG.JWT_TOKEN}`,
    'x-socket-id': `${CONFIG.SOCKET_ID}-spike-${__VU}-${__ITER}`,
  };
}

export default function () {
  const payload = JSON.stringify({
    problemId: CONFIG.PROBLEM_ID,
    code: CODE_SAMPLES.javascript.correct,
    language: 'javascript',
  });

  const response = http.post(`${CONFIG.BASE_URL}/api/submissions`, payload, {
    headers: getHeaders(),
    timeout: '30s',
  });

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
  totalSubmissions.add(1);

  // 제출량을 조절하기 위해 sleep을 평균 1.5초~2초로 설정
  // (100명 * 30초 / 1.75초 = 약 1,700개)
  sleep(Math.random() * 1 + 1);
}

export function setup() {
  console.log('========================================');
  console.log('Spike Test: Target 100 VUs / Expected ~2000 Subs');
  console.log('========================================');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('========================================');
  console.log(`Test Finished: ${duration.toFixed(2)}s`);
  console.log('========================================');
}
