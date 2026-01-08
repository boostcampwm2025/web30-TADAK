export class RedisKeys {
  // Battle 관련
  static battle(battleId: string): string {
    return `battle:${battleId}`;
  }

  static battleByRoom(roomId: string): string {
    return `battle:room:${roomId}`;
  }

  // Room 관련
  static room(roomId: string): string {
    return `room:${roomId}:info`;
  }

  // Matching 관련

  // ZSET: 매칭 대기 큐 (score = timestamp)
  static matchingQueue(): string {
    return `matching:queue`;
  }

  // HSET: 매칭 대기 사용자 정보
  static matchingUser(userId: string): string {
    return `matching:user:${userId}`;
  }

  // LIST: 최근 매칭 대기 시간 (최근 100개)
  static recentMatchTimes(): string {
    return `matching:recent_wait_times`;
  }

  // SET: 진행 중인 배틀 ID 목록
  static activeBattles(): string {
    return `matching:active_battles`;
  }
}
