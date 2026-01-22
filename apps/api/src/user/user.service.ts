import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Glicko2, newProcedure } from 'glicko2.ts';
import { Repository } from 'typeorm';

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
}

const MIN_RD = 100;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly glicko2: Glicko2;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.glicko2 = new Glicko2({
      tau: 0.5,
      rating: 1000,
      rd: 350,
      vol: 0.06,
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

    // 레이팅 업데이트
    this.glicko2.updateRatings([[winnerPlayer, loserPlayer, matchResultScore]]);

    // 새 레이팅 계산 (RD는 최소값 제한)
    const winnerNewRating = Math.round(winnerPlayer.getRating());
    const winnerNewRd = Math.max(winnerPlayer.getRd(), MIN_RD);
    const loserNewRating = Math.round(loserPlayer.getRating());
    const loserNewRd = Math.max(loserPlayer.getRd(), MIN_RD);

    // DB 업데이트
    await this.userRepository.update(winnerId, {
      rating: winnerNewRating,
      rd: winnerNewRd,
      volatility: winnerPlayer.getVol(),
      wins: isDraw ? winner.wins : winner.wins + 1,
    });

    await this.userRepository.update(loserId, {
      rating: loserNewRating,
      rd: loserNewRd,
      volatility: loserPlayer.getVol(),
      losses: isDraw ? loser.losses : loser.losses + 1,
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
      },
      loser: {
        oldRating: loser.rating,
        newRating: loserNewRating,
        oldRd: loser.rd,
        newRd: loserNewRd,
        ratingDelta: loserNewRating - loser.rating,
      },
    };
  }
}
