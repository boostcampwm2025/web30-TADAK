import { Inject, Injectable, Logger } from '@nestjs/common';
import { MATCHING_CONFIG } from '@packages/constants/matching';
import { MatchingUser } from '@packages/types/matching';
import Redis from 'ioredis';

import { BattleService } from '../battle/battle.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';
import { RoomService } from '../room/room.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly roomService: RoomService,
    private readonly battleService: BattleService,
  ) {}

  // 매칭 시작
  async startMatching(): Promise<void> {
    // TODO: 매칭 시작 구현
  }

  // 매칭 취소
  async cancelMatching(): Promise<void> {
    // TODO: 매칭 취소 구현
  }

  // 매칭 로직 (한 Tick당 최대 MAX_MATCH_PER_TICK쌍 매칭)
  async matchUsers(): Promise<MatchingUser[]> {
    const matchedUsers: MatchingUser[] = [];

    // 1. Redis에서 대기 중인 유저 한 번만 조회 (100명)
    const candidates = await this.fetchWaitingUsers(MATCHING_CONFIG.CANDIDATE_LIMIT as number);

    if (candidates.length < 2) {
      return matchedUsers;
    }

    // 2. 이미 매칭된 유저 추적 (중복 매칭 방지)
    const usedIds = new Set<string>();

    // 3. 메모리에서 최대 MAX_MATCH_PER_TICK쌍 매칭
    for (let i = 0; i < MATCHING_CONFIG.MAX_MATCH_PER_TICK; i++) {
      const pair = this.findMatchablePairFromList(candidates, usedIds);

      // 더 이상 매칭 가능한 유저가 없으면 종료
      if (!pair) break;

      const [user1, user2] = pair;

      try {
        // Room & Battle 생성
        const { roomId, battleId } = await this.createMatchedRoom(user1, user2);

        // 매칭 큐에서 제거 및 상태 변경
        await this.redis
          .pipeline()
          .zrem(RedisKeys.matchingQueue(), user1.userId, user2.userId)
          .hset(RedisKeys.matchingUser(user1.userId), 'status', 'MATCHED')
          .hset(RedisKeys.matchingUser(user2.userId), 'status', 'MATCHED')
          .exec();

        matchedUsers.push(user1, user2);

        // Set에 추가하여 중복 매칭 방지
        usedIds.add(user1.userId);
        usedIds.add(user2.userId);

        this.logger.log(
          `Matched users ${user1.userId} (${user1.rating}) and ${user2.userId} (${user2.rating}) -> Battle ${battleId} in Room ${roomId}`,
        );
      } catch (error: unknown) {
        if (error instanceof Error) this.logger.error(`Failed to create match: ${error.message}`);
      }
    }

    return matchedUsers;
  }

  // Redis에서 대기 중인 유저 조회
  private async fetchWaitingUsers(limit: number): Promise<MatchingUser[]> {
    // 1. 대기 시간 순으로 상위 N명 가져오기 (ZSET score = timestamp)
    const userIds = await this.redis.zrange(RedisKeys.matchingQueue(), 0, limit - 1);

    if (userIds.length === 0) {
      return [];
    }

    // 2. Pipeline으로 유저 정보 한 번에 조회 (N+1 문제 해결)
    const pipeline = this.redis.pipeline();
    userIds.forEach((userId) => {
      pipeline.hgetall(RedisKeys.matchingUser(userId));
    });
    const results = (await pipeline.exec()) as [Error | null, Record<string, string>][];

    if (!results) return [];

    // 3. 유저 정보 파싱
    const users: MatchingUser[] = [];
    results.forEach(([err, userdata]) => {
      if (err || !userdata || !userdata.userId) return;

      users.push({
        userId: userdata.userId,
        username: userdata.username,
        rating: parseFloat(userdata.rating),
        tier: JSON.parse(userdata.tier) as MatchingUser['tier'],
        status: userdata.status as MatchingUser['status'],
        waitingSince: new Date(userdata.waitingSince),
        socketId: userdata.socketId,
      } as MatchingUser);
    });

    // 4. 메모리에서 rating 순으로 정렬
    users.sort((a, b) => a.rating - b.rating);

    return users;
  }

  // 메모리 배열에서 매칭 가능한 유저 쌍 찾기
  private findMatchablePairFromList(
    users: MatchingUser[],
    usedIds: Set<string>,
  ): [MatchingUser, MatchingUser] | null {
    for (let i = 0; i < users.length - 1; i++) {
      const user1 = users[i];
      // 이미 매칭된 유저는 skip
      if (usedIds.has(user1.userId)) continue;

      // i번째 유저와 매칭 가능한 다음 유저 찾기
      for (let j = i + 1; j < users.length; j++) {
        const user2 = users[j];
        if (usedIds.has(user2.userId)) continue;

        const ratingDiff = Math.abs(user1.rating - user2.rating);
        if (ratingDiff > MATCHING_CONFIG.MAX_RATING_RANGE) break;

        if (this.canMatch(user1, user2, ratingDiff)) {
          return [user1, user2];
        }
      }
    }

    return null;
  }

  // 두 유저가 매칭 가능한지 여부 판단
  private canMatch(user1: MatchingUser, user2: MatchingUser, ratingDiff: number): boolean {
    // 대기 시간이 더 긴 유저 기준으로 범위 계산
    const now = Date.now();
    const longerWaitTime = Math.max(
      now - user1.waitingSince.getTime(),
      now - user2.waitingSince.getTime(),
    );

    const allowedRange = this.calculateRatingRange(longerWaitTime);

    return ratingDiff <= allowedRange;
  }

  // 대기 시간에 따른 허용 레이팅 범위 계산
  private calculateRatingRange(waitTimeMs: number): number {
    const { INITIAL_RATING_RANGE, RATING_RANGE_INCREMENT, EXPANSION_INTERVAL_MS } = MATCHING_CONFIG;

    const expansions = Math.floor(waitTimeMs / EXPANSION_INTERVAL_MS);
    return INITIAL_RATING_RANGE + expansions * RATING_RANGE_INCREMENT;
  }

  // 매칭 성공 시
  private async createMatchedRoom(
    user1: MatchingUser,
    user2: MatchingUser,
  ): Promise<{ roomId: string; battleId: string }> {
    // Room ID 생성 (타임스탬프 + 랜덤)
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Room 생성 (createRoom에서 Battle도 자동 생성됨)
    const room = await this.roomService.createRoom(roomId);

    // 두 유저를 플레이어로 추가
    room.currentPlayers = [
      { userId: user1.userId, username: user1.username, role: 'player' },
      { userId: user2.userId, username: user2.username, role: 'player' },
    ];
    room.status = 'in-battle';
    await this.roomService.saveRoom(room);

    // Battle ID 조회 (Room 생성 시 자동으로 Battle이 생성됨)
    // TODO: battleService에 getBattleIdByRoomId 메서드가 있는지 확인 필요
    // 현재는 임시로 battleId를 생성
    const battleId = `battle-${roomId}`;

    this.logger.log(`Created room ${roomId} for users ${user1.userId} and ${user2.userId}`);

    return { roomId, battleId };
  }

  // 매칭 타임아웃 유저 조회
  async findTimeoutUsers(): Promise<void> {
    // TODO: 매칭 타임아웃 유저 조회
  }
}
