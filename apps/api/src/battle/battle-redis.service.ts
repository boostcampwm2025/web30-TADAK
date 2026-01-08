import { Inject, Injectable } from '@nestjs/common';
import { Battle } from '@packages/types/battle';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@/redis/redis.module';
import { RedisKeys } from '@/redis/redis-key.constant';

@Injectable()
export class BattleRedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async createBattle(battle: Battle): Promise<void> {
    try {
      const key = RedisKeys.battle(battle.battleId);
      await this.redis.set(key, JSON.stringify(battle));

      // roomId로 battleId 매핑 저장
      const roomKey = RedisKeys.battleByRoom(battle.roomId);
      await this.redis.set(roomKey, battle.battleId);

      // 진행 중인 배틀 목록에 추가
      await this.redis.sadd(RedisKeys.activeBattles(), battle.battleId);
    } catch (error) {
      // TODO: 에러 로깅 추가
      console.error('Failed to create battle in Redis:', error);
    }
  }

  async getBattle(battleId: string): Promise<Battle | null> {
    const key = RedisKeys.battle(battleId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as Battle;
  }

  async getBattleIdByRoomId(roomId: string): Promise<string | null> {
    const roomKey = RedisKeys.battleByRoom(roomId);
    const battleId = await this.redis.get(roomKey);

    return battleId;
  }

  async updateBattle(battle: Battle): Promise<void> {
    const key = RedisKeys.battle(battle.battleId);
    await this.redis.set(key, JSON.stringify(battle));
  }

  async deleteBattle(battleId: string, roomId: string): Promise<void> {
    const key = RedisKeys.battle(battleId);
    const roomKey = RedisKeys.battleByRoom(roomId);
    await this.redis.del(key, roomKey);

    // 활성 배틀 목록에서 제거
    await this.redis.srem(RedisKeys.activeBattles(), battleId);
  }

  async getActiveBattles(): Promise<Battle[]> {
    // 활성 배틀 ID 목록 가져오기
    const battleIds = await this.redis.smembers(RedisKeys.activeBattles());

    if (battleIds.length === 0) {
      return [];
    }

    // Pipeline으로 모든 배틀 정보 한 번에 조회
    const pipeline = this.redis.pipeline();
    battleIds.forEach((battleId) => {
      pipeline.get(RedisKeys.battle(battleId));
    });
    const results = (await pipeline.exec()) as [Error | null, string | null][];

    if (!results) return [];

    // 배틀 정보 파싱
    const battles: Battle[] = [];
    results.forEach(([err, data]) => {
      if (!err && data) {
        try {
          battles.push(JSON.parse(data) as Battle);
        } catch (error) {
          console.error('Failed to parse battle data:', error);
        }
      }
    });

    return battles;
  }
}
