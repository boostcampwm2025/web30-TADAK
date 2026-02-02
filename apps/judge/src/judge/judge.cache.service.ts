import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';

import { REDIS_CLIENT } from '../redis/redis.module';
import { FinalResult } from './judge.context';

@Injectable()
export class JudgeCacheService {
  private readonly logger = new Logger(JudgeCacheService.name);
  private readonly CACHE_PREFIX = 'judge:cache:';
  private readonly CACHE_TTL = 3600; // 1시간

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * 문제 ID, 타입, 코드를 기반으로 캐시 키 생성
   */
  generateKey(problemId: string, type: string, code: string): string {
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    return `${this.CACHE_PREFIX}${problemId}:${type}:${hash}`;
  }

  /**
   * 캐시된 결과 조회
   */
  async get(key: string): Promise<FinalResult | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as FinalResult;
    } catch (error) {
      this.logger.error('Failed to get judge cache', error);
      return null;
    }
  }

  /**
   * 결과 캐싱
   */
  async set(key: string, result: FinalResult): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(result), 'EX', this.CACHE_TTL);
    } catch (error) {
      this.logger.error('Failed to set judge cache', error);
    }
  }
}
