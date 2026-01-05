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

  // ZSET: 매칭 대기 큐 (score = rating)
  static matchingQueue(): string {
    return `matching:queue`;
  }

  // HSET: 매칭 대기 사용자 정보
  static matchingUser(userId: string): string {
    return `matching:user:${userId}`;
  }

  //
}
