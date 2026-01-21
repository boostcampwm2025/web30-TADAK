export const BATTLE_CONFIG = {
  DURATION: 30 * 60, // 기본 배틀 시간: 30분 (초 단위)
  DEFAULT_LANGUAGE: 'javascript',
} as const;

export const DEFAULT_CODE_TEMPLATE = `function solution() {
  // TODO
}`;

export const BATTLE_EVENTS = {
  // 배틀 생성 및 시작
  BATTLE_CREATED: 'battle-created',
  BATTLE_STARTED: 'battle-started',
  BATTLE_ENDED: 'battle-ended',

  // 코드 변경
  CODE_CHANGE: 'code-change',
  CODE_UPDATED: 'code-updated',
  CODE_METADATA: 'code-metadata', // 상대방에게 코드 변경 알림

  // 유저 상태 변경
  USER_CONNECTED: 'user-connected',
  USER_DISCONNECTED: 'user-disconnected',
  USER_FINISHED: 'user-finished',

  // 진행 상황 업데이트
  PROGRESS_UPDATE: 'progress-update',
  TEST_RESULT: 'test-result',

  // 유저 진행률
  USER_TEST_RESULT: 'user-test-result',

  // 배틀 상태 업데이트
  BATTLE_STATUS_UPDATE: 'battle-status-update',
} as const;
