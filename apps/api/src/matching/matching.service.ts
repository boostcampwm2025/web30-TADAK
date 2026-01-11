import { Inject, Injectable, Logger } from '@nestjs/common';
import { MATCHING_CONFIG } from '@packages/constants/matching';
import { MatchingUser, UserRate } from '@packages/types/matching';
import Redis from 'ioredis';

import { BattleService } from '../battle/battle.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisKeys } from '../redis/redis-key.constant';
import { RoomService } from '../room/room.service';
import { MatchingGateway } from './matching.gateway';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly roomService: RoomService,
    private readonly battleService: BattleService,
    private readonly matchingGateway: MatchingGateway,
  ) {}

  // 매칭 시작
  async startMatching(user: MatchingUser): Promise<void> {
    const existing = await this.redis.hget(RedisKeys.matchingUser(user.userId), 'status');
    if (existing === 'WAITING' || existing === 'MATCHED') {
      this.logger.warn(`User ${user.userId} is already in state ${existing}`);
      return;
    }

    // 소켓-유저 매핑 등록 (disconnect 시 자동 취소를 위함)
    this.matchingGateway.registerUserSocket(user.socketId, user.userId);

    const pipeline = this.redis.pipeline();
    // ZSET: score = timestamp (대기 시간 기준 정렬용)
    pipeline.zadd(RedisKeys.matchingQueue(), Date.now(), user.userId);
    // HSET: 유저 상세 정보 저장
    pipeline.hset(RedisKeys.matchingUser(user.userId), {
      userId: user.userId,
      username: user.username,
      rating: user.rating.toString(),
      tier: JSON.stringify(user.tier),
      socketId: user.socketId,
      waitingSince: user.waitingSince.toISOString(),
      status: 'WAITING',
      myRate: JSON.stringify(user.myRate),
      avatarUrl: user.avatarUrl || '',
    });

    await pipeline.exec();
    this.logger.log(`User ${user.userId} started matching`);
  }

  // 매칭 취소
  async cancelMatching(userId: string): Promise<void> {
    const userdata = await this.redis.hgetall(RedisKeys.matchingUser(userId));
    if (!userdata) return;

    const pipeline = this.redis.pipeline();

    // 만약 이미 매칭된 상태에서 취소(연결 끊김)된 경우라면 상대방 처리
    if (userdata.status === 'MATCHED' && userdata.opponentId) {
      const opponentData = await this.redis.hgetall(RedisKeys.matchingUser(userdata.opponentId));

      if (opponentData) {
        // 상대방에게 알림 전송
        this.matchingGateway.emitOpponentDisconnected(opponentData.socketId);

        // 상대방 다시 큐로 복귀 (WAITING 상태로 변경 및 큐에 재진입)
        const opponentMyRate = opponentData.myRate
          ? (JSON.parse(opponentData.myRate) as UserRate)
          : ({ win: 0, lose: 0, draw: 0, winRate: 0 } as UserRate);

        const opponent: MatchingUser = {
          userId: opponentData.userId,
          username: opponentData.username,
          rating: parseFloat(opponentData.rating),
          tier: JSON.parse(opponentData.tier) as MatchingUser['tier'],
          socketId: opponentData.socketId,
          status: 'WAITING',
          waitingSince: new Date(opponentData.waitingSince),
          myRate: opponentMyRate,
          avatarUrl: opponentData.avatarUrl || '',
        };

        // 큐에 넣기 위해 점수를 작게(오래된 것처럼) 설정
        pipeline.zadd(
          RedisKeys.matchingQueue(),
          new Date(opponentData.waitingSince).getTime(),
          opponent.userId,
        );
        pipeline.hset(RedisKeys.matchingUser(opponent.userId), {
          userId: opponent.userId,
          username: opponent.username,
          rating: opponent.rating.toString(),
          tier: JSON.stringify(opponent.tier),
          socketId: opponent.socketId,
          waitingSince: opponent.waitingSince.toISOString(),
          status: 'WAITING',
          myRate: JSON.stringify(opponent.myRate),
          avatarUrl: opponent.avatarUrl || '',
          roomId: '',
          opponentId: '',
        });
      }

      // 이미 배틀이 시작된 상태라면 방/배틀은 유지하고 상대 재입장(혹은 재매칭)만 처리합니다.
      // 추후 명확한 종료 정책이 생기면 여기서 방/배틀 정리 로직을 추가!
    }

    await pipeline
      .zrem(RedisKeys.matchingQueue(), userId)
      .del(RedisKeys.matchingUser(userId))
      .exec();

    this.logger.log(`User ${userId} canceled matching (Finalized)`);
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

      if (!pair) break;

      const [user1, user2] = pair;

      try {
        // Room & Battle 생성
        const { room, battle } = await this.createMatch(user1, user2);

        // 대기 시간 계산 및 저장
        const now = Date.now();
        const waitTime1 = now - user1.waitingSince.getTime();
        const waitTime2 = now - user2.waitingSince.getTime();
        const avgWaitTime = Math.round((waitTime1 + waitTime2) / 2);

        // 매칭 큐에서 제거 및 상태 변경 (상대방 정보 포함하여 연결 끊김 대비)
        await this.redis
          .pipeline()
          .zrem(RedisKeys.matchingQueue(), user1.userId, user2.userId)
          .hset(RedisKeys.matchingUser(user1.userId), {
            status: 'MATCHED',
            roomId: room.roomId,
            opponentId: user2.userId,
          })
          .hset(RedisKeys.matchingUser(user2.userId), {
            status: 'MATCHED',
            roomId: room.roomId,
            opponentId: user1.userId,
          })
          // 1시간 후 자동 삭제 (공간 절약)
          .expire(RedisKeys.matchingUser(user1.userId), 3600)
          .expire(RedisKeys.matchingUser(user2.userId), 3600)
          .lpush(RedisKeys.recentMatchTimes(), avgWaitTime) // 리스트의 맨 앞에 추가
          .ltrim(RedisKeys.recentMatchTimes(), 0, 99) // 최근 100개만 유지
          .exec();

        // 소켓 이벤트: 매칭 성공 알림
        this.matchingGateway.emitMatchSuccess(user1, user2, room, battle);

        matchedUsers.push(user1, user2);

        // Set에 추가하여 중복 매칭 방지
        usedIds.add(user1.userId);
        usedIds.add(user2.userId);

        this.logger.log(
          `Matched: ${user1.username}(${user1.rating}) vs ${user2.username}(${user2.rating}) -> Room: ${room.roomId}, Battle: ${battle.battleId}`,
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
        myRate: userdata.myRate
          ? (JSON.parse(userdata.myRate) as UserRate)
          : ({ win: 0, lose: 0, draw: 0, winRate: 0 } as UserRate),
        avatarUrl: userdata.avatarUrl || '',
      });
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

  // 매칭 성공 시 Room & Battle 생성
  private async createMatch(user1: MatchingUser, user2: MatchingUser) {
    const result = await this.roomService.createMatchedRoom(user1, user2);
    await this.matchingGateway.broadcastRoomList();
    return result;
  }

  // 매칭 지연 유저 알림
  async findTimeoutUsers(): Promise<void> {
    const now = Date.now();
    const timeoutThreshold = MATCHING_CONFIG.MAX_WAIT_TIME_MS;

    // 대기열의 모든 유저 ID 조회
    const userIds = await this.redis.zrange(RedisKeys.matchingQueue(), 0, -1);
    if (userIds.length === 0) return;

    for (const userId of userIds) {
      const userdata = await this.redis.hgetall(RedisKeys.matchingUser(userId));
      if (!userdata || !userdata.waitingSince) continue;

      const waitTime = now - new Date(userdata.waitingSince).getTime();
      // 60초가 지났고 아직 지연 알림을 보내지 않은 경우
      if (waitTime > timeoutThreshold && userdata.isDelayedNotified !== 'true') {
        this.logger.log(`User ${userId} matching delay detected (${waitTime}ms)`);

        if (userdata.socketId) {
          this.matchingGateway.emitMatchingTimeout(userdata.socketId);
        }

        // 중복 알림 방지를 위해 플래그 설정
        await this.redis.hset(RedisKeys.matchingUser(userId), 'isDelayedNotified', 'true');
      }
    }
  }

  // 매칭 큐에 있는 사용자들의 socketId 목록 조회
  async getMatchingQueueSocketIds(): Promise<string[]> {
    // 매칭 큐에 있는 모든 userId 가져오기
    const userIds = await this.redis.zrange(RedisKeys.matchingQueue(), 0, -1);

    if (userIds.length === 0) {
      return [];
    }

    // Pipeline으로 각 userId의 socketId 가져오기
    const pipeline = this.redis.pipeline();
    userIds.forEach((userId) => {
      pipeline.hget(RedisKeys.matchingUser(userId), 'socketId');
    });
    const results = (await pipeline.exec()) as [Error | null, string | null][];

    if (!results) return [];

    const socketIds: string[] = [];
    results.forEach(([err, socketId]) => {
      if (!err && socketId) {
        socketIds.push(socketId);
      }
    });

    return socketIds;
  }

  // 매칭 통계 조회
  async getMatchingStats(): Promise<{
    waitingPlayers: number;
    ongoingBattles: number;
    avgMatchTime: number;
  }> {
    // 1. 대기 중인 플레이어 수
    const waitingPlayers = await this.redis.zcard(RedisKeys.matchingQueue());

    // 2. 진행 중인 배틀 수
    const ongoingBattles = await this.redis.scard(RedisKeys.activeBattles());

    // 3. 평균 매칭 시간 (최근 100개 매칭의 평균 대기 시간)
    let avgMatchTime = 0;
    const recentWaitTimes = await this.redis.lrange(RedisKeys.recentMatchTimes(), 0, -1);

    if (recentWaitTimes.length > 0) {
      const totalWaitTime = recentWaitTimes.reduce((sum, time) => sum + Number(time), 0);
      avgMatchTime = Math.round(totalWaitTime / recentWaitTimes.length / 1000); // 초 단위
    }

    return {
      waitingPlayers,
      ongoingBattles,
      avgMatchTime,
    };
  }
}
