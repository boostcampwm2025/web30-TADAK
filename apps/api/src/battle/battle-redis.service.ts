import { Inject, Injectable } from '@nestjs/common';
import { Battle } from '@packages/types/battle';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '@/redis/redis.module';
import { RedisKeys } from '@/redis/redis-key.constant';
import { REDIS_TTL } from '@/redis/redis-ttl.constant';

@Injectable()
export class BattleRedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async createBattle(battle: Battle): Promise<void> {
    try {
      const key = RedisKeys.battle(battle.battleId);
      const roomKey = RedisKeys.battleByRoom(battle.roomId);

      // 배틀 데이터 저장
      const pipeline = this.redis.pipeline();
      pipeline.set(key, JSON.stringify(battle));
      pipeline.expire(key, REDIS_TTL.BATTLE);
      pipeline.set(roomKey, battle.battleId);
      pipeline.expire(roomKey, REDIS_TTL.BATTLE_ROOM_MAPPING);
      pipeline.sadd(RedisKeys.activeBattles(), battle.battleId);
      await pipeline.exec();
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
    const pipeline = this.redis.pipeline();
    pipeline.set(key, JSON.stringify(battle));
    pipeline.expire(key, REDIS_TTL.BATTLE);
    await pipeline.exec();
  }

  async deleteBattle(battleId: string, roomId: string): Promise<void> {
    const key = RedisKeys.battle(battleId);
    const roomKey = RedisKeys.battleByRoom(roomId);
    await this.redis.del(key, roomKey);

    await this.redis.srem(RedisKeys.activeBattles(), battleId);
  }
}
