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
}
