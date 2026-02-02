// Redis TTL 설정 (초 단위)
export const REDIS_TTL = {
  // 배틀 관련 데이터: 2시간
  BATTLE: 2 * 60 * 60, // 7200초
  BATTLE_ROOM_MAPPING: 2 * 60 * 60,
  ROOM: 2 * 60 * 60,

  // 매칭 유저 데이터: 2시간 (매칭 성공 후)
  MATCHING_USER: 2 * 60 * 60,
} as const;
