import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { CONFIG } from './config.js';

// 커스텀 메트릭 정의
const matchingStartSuccess = new Rate('matching_start_success');
const matchingCancelSuccess = new Rate('matching_cancel_success');
const matchingStartDuration = new Trend('matching_start_duration');
const totalMatchingRequests = new Counter('total_matching_requests');

/**
 * 매칭 부하 테스트
 *
 * 테스트 목적:
 * 1. 다수 유저 동시 매칭 요청 시 시스템 안정성 확인
 * 2. 실제 매칭 성사 여부 확인
 * 3. 매칭 Tick 재진입 방지 로직 검증
 *
 * 사용법:
 *   k6 run matching-load-test.js                     # 기본 (10 VUs)
 *   k6 run -e VUS=20 matching-load-test.js           # 20 VUs
 *   k6 run -e VUS=50 -e DURATION=2m matching-load-test.js
 */

const VUS = parseInt(__ENV.VUS || '10');
const DURATION = __ENV.DURATION || '1m';

export const options = {
  scenarios: {
    matching_test: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.1'],
    matching_start_success: ['rate>0.8'],
  },
};

// 테스트 토큰 저장용 (setup에서 생성)
let testUsers = [];

/**
 * 테스트 토큰 생성
 */
function createTestToken(index) {
  const response = http.post(`${CONFIG.BASE_URL}/api/auth/test-token?index=${index}`, null, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  if (response.status === 200 || response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      return { token: body.accessToken, userId: body.userId, index };
    } catch (e) {
      console.log(`Token parse error for index ${index}: ${e.message}`);
    }
  } else {
    console.log(`Token creation failed for index ${index}: ${response.status}`);
  }
  return null;
}

/**
 * 매칭 시작 요청
 */
function startMatching(token, userId, socketId) {
  const payload = JSON.stringify({
    userId: userId,
    socketId: socketId,
  });

  const response = http.post(`${CONFIG.BASE_URL}/api/matching/start`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: '30s',
  });

  return response;
}

/**
 * 매칭 취소 요청
 */
function cancelMatching(token, userId) {
  const payload = JSON.stringify({
    userId: userId,
  });

  const response = http.post(`${CONFIG.BASE_URL}/api/matching/cancel`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: '30s',
  });

  return response;
}

/**
 * 테스트 시작 시 실행 - 토큰 생성
 */
export function setup() {
  console.log('========================================');
  console.log('매칭 시스템 부하 테스트');
  console.log('========================================');
  console.log(`VUs: ${VUS}`);
  console.log(`Duration: ${DURATION}`);
  console.log(`Target: ${CONFIG.BASE_URL}`);
  console.log('========================================');

  // 연결 테스트
  const healthCheck = http.get(`${CONFIG.BASE_URL}/api/health`, { timeout: '5s' });
  if (healthCheck.status !== 200) {
    console.warn(`Warning: Health check failed with status ${healthCheck.status}`);
  }

  // VU 수만큼 테스트 토큰 생성
  console.log(`Creating ${VUS} test users...`);
  const users = [];

  for (let i = 0; i < VUS; i++) {
    const user = createTestToken(i);
    if (user) {
      users.push(user);
      console.log(`Created user ${i}: ${user.userId}`);
    }
  }

  console.log(`Successfully created ${users.length} test users`);
  console.log('========================================');

  return { users, startTime: Date.now() };
}

/**
 * 메인 테스트 함수
 */
export default function (data) {
  // VU 번호에 해당하는 유저 사용 (1-indexed)
  const userIndex = (__VU - 1) % data.users.length;
  const user = data.users[userIndex];

  if (!user) {
    console.log(`VU ${__VU}: No user available`);
    sleep(1);
    return;
  }

  const uniqueSocketId = `k6-matching-${user.index}-${__ITER}-${Date.now()}`;

  // 1. 매칭 시작
  const startResponse = startMatching(user.token, user.userId, uniqueSocketId);
  totalMatchingRequests.add(1);

  const startSuccess = check(startResponse, {
    'matching start: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'matching start: success is true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });

  matchingStartSuccess.add(startSuccess);
  matchingStartDuration.add(startResponse.timings.duration);

  if (!startSuccess) {
    console.log(
      `VU ${__VU} (user ${user.index}): Start failed - ${startResponse.status}, ${startResponse.body}`,
    );
  }

  // 2. 매칭 대기 (실제 매칭이 이루어질 수 있도록 대기)
  // 매칭 Tick이 2초마다 실행되므로 3~5초 대기
  sleep(Math.random() * 2 + 3);

  // 3. 매칭 취소 (매칭되지 않은 경우 정리)
  const cancelResponse = cancelMatching(user.token, user.userId);
  totalMatchingRequests.add(1);

  const cancelSuccess = check(cancelResponse, {
    'matching cancel: status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  matchingCancelSuccess.add(cancelSuccess);

  // 다음 iteration 전 짧은 대기
  sleep(Math.random() + 0.5);
}

/**
 * 테스트 종료 시 실행
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('========================================');
  console.log('매칭 부하 테스트 완료');
  console.log(`총 소요 시간: ${duration.toFixed(2)}초`);
  console.log(`테스트 유저 수: ${data.users.length}`);
  console.log('========================================');
  console.log('');
  console.log('확인 사항:');
  console.log('1. 서버 로그에서 매칭 성사 여부 확인');
  console.log('2. Redis에서 매칭 대기열 상태 확인');
  console.log('3. 중복 매칭 발생 여부 확인');
  console.log('========================================');
}
