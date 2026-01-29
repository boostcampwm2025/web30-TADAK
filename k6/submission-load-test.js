import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { CONFIG, CODE_SAMPLES, PRESETS, DEFAULT_PRESET } from './config.js';

// 커스텀 메트릭 정의
const submissionSuccessRate = new Rate('submission_success_rate');
const submissionDuration = new Trend('submission_duration');

/**
 * 프리셋 선택
 *
 * 사용법:
 *   k6 run -e PRESET=smoke submission-load-test.js   # 최소 (30초)
 *   k6 run -e PRESET=small submission-load-test.js   # 소규모 (1분)
 *   k6 run -e PRESET=medium submission-load-test.js  # 중규모 (3분)
 *   k6 run -e PRESET=large submission-load-test.js   # 대규모 (5분)
 *   k6 run -e PRESET=full submission-load-test.js    # 전체 (7분 30초)
 */
const presetName = __ENV.PRESET || DEFAULT_PRESET;
const preset = PRESETS[presetName] || PRESETS[DEFAULT_PRESET];

export const options = {
  stages: preset.stages,
  thresholds: {
    // 95% 요청이 10초 이내 응답
    http_req_duration: ['p(95)<10000'],
    // 실패율 5% 미만
    http_req_failed: ['rate<0.05'],
    // 커스텀 메트릭: 제출 성공률 90% 이상
    submission_success_rate: ['rate>0.9'],
  },
};

/**
 * 기본 헤더
 */
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CONFIG.JWT_TOKEN}`,
    'x-socket-id': `${CONFIG.SOCKET_ID}-${__VU}-${__ITER}`,
  };
}

/**
 * 코드 제출 요청
 */
function submitCode(code, language = 'javascript') {
  const payload = JSON.stringify({
    problemId: CONFIG.PROBLEM_ID,
    code: code,
    language: language,
  });

  const response = http.post(`${CONFIG.BASE_URL}/api/submissions`, payload, {
    headers: getHeaders(),
    timeout: '60s',
  });

  return response;
}

/**
 * 드라이런 (테스트 실행) 요청
 */
function dryRunCode(code, language = 'javascript') {
  const payload = JSON.stringify({
    problemId: CONFIG.PROBLEM_ID,
    code: code,
    language: language,
  });

  const response = http.post(`${CONFIG.BASE_URL}/api/submissions/dry-run`, payload, {
    headers: getHeaders(),
    timeout: '60s',
  });

  return response;
}

/**
 * 메인 테스트 함수
 * 각 VU(가상 사용자)가 반복 실행
 */
export default function () {
  // 정답 코드로 제출
  const response = submitCode(CODE_SAMPLES.javascript.correct);

  // 응답 검증
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has submissionId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.submissionId !== undefined;
      } catch {
        return false;
      }
    },
    'status is PENDING': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'PENDING';
      } catch {
        return false;
      }
    },
  });

  // 커스텀 메트릭 기록
  submissionSuccessRate.add(success);
  submissionDuration.add(response.timings.duration);

  // 로그 (디버깅용)
  if (!success) {
    console.log(
      `VU ${__VU}, Iter ${__ITER}: Failed - Status ${response.status}, Body: ${response.body}`,
    );
  }

  // 요청 간 간격 (1~3초 랜덤)
  sleep(Math.random() * 2 + 1);
}

/**
 * 테스트 시작 시 실행
 */
export function setup() {
  console.log('========================================');
  console.log('채점 시스템 부하 테스트');
  console.log('========================================');
  console.log(`Preset: ${presetName}`);
  console.log(`Description: ${preset.description}`);
  console.log(`Target: ${CONFIG.BASE_URL}`);
  console.log(`Problem ID: ${CONFIG.PROBLEM_ID}`);
  console.log('========================================');

  // 연결 테스트
  const healthCheck = http.get(`${CONFIG.BASE_URL}/api/health`, {
    timeout: '5s',
  });

  if (healthCheck.status !== 200) {
    console.warn(`Warning: Health check failed with status ${healthCheck.status}`);
  }

  return { startTime: Date.now() };
}

/**
 * 테스트 종료 시 실행
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('========================================');
  console.log('테스트 완료');
  console.log(`총 소요 시간: ${duration.toFixed(2)}초`);
  console.log('========================================');
}
