/**
 * k6 부하 테스트 설정
 */

const TOKEN = '';

export const CONFIG = {
  // API 서버 주소
  BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',

  // JWT 인증 토큰 (환경변수 또는 하드코딩)
  JWT_TOKEN: __ENV.JWT_TOKEN || TOKEN || 'PUT_YOUR_JWT_TOKEN_HERE',

  // 테스트할 문제 ID
  PROBLEM_ID: __ENV.PROBLEM_ID || 'beta_easy_1',

  // 테스트용 소켓 ID (실제 소켓 연결 없이 테스트용)
  SOCKET_ID: __ENV.SOCKET_ID || 'k6-load-test-socket',
};

/**
 * 테스트 규모 프리셋
 *
 * 사용법: k6 run -e PRESET=small submission-load-test.js
 */
export const PRESETS = {
  // 최소 테스트 (약 30개 요청, 30초)
  smoke: {
    stages: [
      { duration: '10s', target: 2 },
      { duration: '10s', target: 2 },
      { duration: '10s', target: 0 },
    ],
    description: '스모크 테스트: 기본 동작 확인 (2 VUs, 30초)',
  },

  // 소규모 테스트 (약 150개 요청, 1분)
  small: {
    stages: [
      { duration: '15s', target: 5 },
      { duration: '30s', target: 5 },
      { duration: '15s', target: 0 },
    ],
    description: '소규모 테스트: 기본 부하 (5 VUs, 1분)',
  },

  // 중규모 테스트 (약 900개 요청, 3분)
  medium: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 20 },
      { duration: '1m', target: 20 },
      { duration: '30s', target: 0 },
    ],
    description: '중규모 테스트: 보통 부하 (20 VUs, 3분)',
  },

  // 대규모 테스트 (약 3,600개 요청, 5분)
  large: {
    stages: [
      { duration: '30s', target: 20 },
      { duration: '1m', target: 50 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 0 },
    ],
    description: '대규모 테스트: 높은 부하 (50 VUs, 5분)',
  },

  // 최대 테스트 (약 13,000개 요청, 7분 30초)
  full: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 50 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '2m', target: 100 },
      { duration: '1m', target: 0 },
    ],
    description: '전체 테스트: 최대 부하 (100 VUs, 7분 30초)',
  },
};

// 기본 프리셋
export const DEFAULT_PRESET = 'small';

/**
 * 테스트용 코드 샘플
 */
export const CODE_SAMPLES = {
  // 정답 코드 (문제에 따라 수정 필요)
  javascript: {
    correct: `
function solution(input) {
  const [P, M, K] = input.split(' ').map(Number);
  if (K <= 10 && P * K <= M) {
    console.log("YES");
  } else {
    console.log("NO");
  }
}
`.trim(),

    // 오답 코드 (WRONG_ANSWER 테스트용)
    wrong: `
function solution(input) {
  const [P, M, K] = input.split(' ').map(Number);
  if (K <= 10 && P * K <= M) {
    console.log("YES");
  }
}
`.trim(),

    // 시간초과 코드 (TIME_LIMIT_EXCEEDED 테스트용)
    timeout: `
while(true) {}
`.trim(),

    // 런타임 에러 코드 (RUNTIME_ERROR 테스트용)
    runtimeError: `
throw new Error('Runtime Error');
`.trim(),
  },
};
