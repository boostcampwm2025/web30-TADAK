export const MATCHING_CONFIG = {
  TICK_INTERVAL_MS: 2000, // 매칭 상태 갱신 주기 (2초)
  INITIAL_RATING_RANGE: 100, // 초기 매칭 등급 범위
  RATING_RANGE_INCREMENT: 50, // 매칭 대기 시간 경과 시 등급 범위 증가량
  EXPANSION_INTERVAL_MS: 20000, // 등급 범위 확장 주기 (20초)
  MAX_WAIT_TIME_MS: 60000, // 최대 매칭 대기 시간 (60초)

  MAX_MATCH_PER_TICK: 5, // 한 틱당 최대 매칭 시도 횟수 (5쌍 = 10명)
  CANDIDATE_LIMIT: 100, // 매칭 후보로 고려할 최대 유저 수 (대기 순서 100명)
} as const;
