import { Inject, Injectable, Logger } from '@nestjs/common';
import { MATCHING_CONFIG } from '@packages/constants/matching';
import { MatchingUser } from '@packages/types/matching';
import Redis from 'ioredis';

import { BattleService } from '../battle/battle.service';
import { REDIS_CLIENT } from '../redis/redis.module';
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
  matchUsers(): MatchingUser[] {
    const matchedUsers: MatchingUser[] = [];

    // 한 Tick당 최대 매칭 횟수만큼 시도
    for (let i = 0; i < MATCHING_CONFIG.MAX_MATCH_PER_TICK; i++) {
      // TODO: 매칭 로직 구현
      // 1. 매칭 가능한 유저 쌍 찾기
      // 2. Room/Battle 생성
      // 3. 유저 쌍 매칭 큐에서 제거
      // 4. matchedUsers 배열에 추가
    }

    return matchedUsers;
  }

  // 매칭 타임아웃 유저 조회
  async findTimeoutUsers(): Promise<void> {
    // TODO: 매칭 타임아웃 유저 조회
  }
}
