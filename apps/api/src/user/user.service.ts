import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { clampRating, getTierFromRating, RATING_CONFIG } from '@packages/constants/rating';
import { Glicko2, newProcedure } from 'glicko2.ts';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { REDIS_CLIENT } from '@/redis/redis.module';
import { RedisKeys } from '@/redis/redis-key.constant';

import { User } from './user.entity';

export const MatchResult = {
  WIN: 1,
  LOSS: 0,
  DRAW: 0.5,
} as const;

export type MatchResultValue = (typeof MatchResult)[keyof typeof MatchResult];

export interface RatingUpdateResult {
  oldRating: number;
  newRating: number;
  oldRd: number;
  newRd: number;
  ratingDelta: number;
  tier: { tier: string; division: number };
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly glicko2: Glicko2;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.glicko2 = new Glicko2({
      tau: RATING_CONFIG.TAU,
      rating: RATING_CONFIG.INITIAL_RATING,
      rd: RATING_CONFIG.INITIAL_RD,
      vol: RATING_CONFIG.INITIAL_VOLATILITY,
      volatilityAlgorithm: newProcedure,
    });
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { githubId } });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(id, { refreshToken });
  }

  async removeRefreshToken(id: string): Promise<void> {
    await this.userRepository.update(id, { refreshToken: null });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateRatings(
    winnerId: string,
    loserId: string,
    isDraw: boolean = false,
  ): Promise<{ winner: RatingUpdateResult; loser: RatingUpdateResult }> {
    const winner = await this.findOne(winnerId);
    const loser = await this.findOne(loserId);

    if (!winner || !loser) {
      throw new Error('User not found');
    }

    // Glicko2 플레이어 객체 생성
    const winnerPlayer = this.glicko2.makePlayer(winner.rating, winner.rd, winner.volatility);
    const loserPlayer = this.glicko2.makePlayer(loser.rating, loser.rd, loser.volatility);

    // 매치 결과 설정 (승자 기준: 1=승, 0=패, 0.5=무승부)
    const matchResultScore = isDraw ? MatchResult.DRAW : MatchResult.WIN;

    this.glicko2.updateRatings([[winnerPlayer, loserPlayer, matchResultScore]]);

    const winnerNewRating = clampRating(Math.round(winnerPlayer.getRating()));
    const winnerNewRd = Math.max(winnerPlayer.getRd(), RATING_CONFIG.MIN_RD);
    const loserNewRating = clampRating(Math.round(loserPlayer.getRating()));
    const loserNewRd = Math.max(loserPlayer.getRd(), RATING_CONFIG.MIN_RD);

    const winnerNewTier = getTierFromRating(winnerNewRating);
    const loserNewTier = getTierFromRating(loserNewRating);

    // DB 업데이트
    await this.userRepository.update(winnerId, {
      rating: winnerNewRating,
      rd: winnerNewRd,
      volatility: winnerPlayer.getVol(),
      tier: winnerNewTier,
      wins: isDraw ? winner.wins : winner.wins + 1,
      draws: isDraw ? winner.draws + 1 : winner.draws,
    });

    await this.userRepository.update(loserId, {
      rating: loserNewRating,
      rd: loserNewRd,
      volatility: loserPlayer.getVol(),
      tier: loserNewTier,
      losses: isDraw ? loser.losses : loser.losses + 1,
      draws: isDraw ? loser.draws + 1 : loser.draws,
    });

    this.logger.log(
      `Rating updated: ${winner.username} ${winner.rating} -> ${winnerNewRating}, ${loser.username} ${loser.rating} -> ${loserNewRating}`,
    );

    return {
      winner: {
        oldRating: winner.rating,
        newRating: winnerNewRating,
        oldRd: winner.rd,
        newRd: winnerNewRd,
        ratingDelta: winnerNewRating - winner.rating,
        tier: winnerNewTier,
      },
      loser: {
        oldRating: loser.rating,
        newRating: loserNewRating,
        oldRd: loser.rd,
        newRd: loserNewRd,
        ratingDelta: loserNewRating - loser.rating,
        tier: loserNewTier,
      },
    };
  }

  // 유저의 현재 활성 방 ID 조회
  async getUserCurrentRoomId(userId: string): Promise<string | null> {
    try {
      const status = await this.redis.hget(RedisKeys.matchingUser(userId), 'status');
      const roomId = await this.redis.hget(RedisKeys.matchingUser(userId), 'roomId');

      // 방에 있는 상태(IN_ROOM)이거나 배틀 중인 상태에서 리다이렉트
      if (status === 'IN_ROOM' && roomId) {
        return roomId;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error fetching user room status: ${userId}`, error);
      return null;
    }
  }
}
