import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { clampRating, getTierFromRating, RATING_CONFIG } from '@packages/constants/rating';
import { BattleHistoryItem, SubmissionHistoryItem } from '@packages/types/user';
import { Glicko2, newProcedure } from 'glicko2.ts';
import Redis from 'ioredis';
import { EntityManager, In, Repository } from 'typeorm';

import { Battle } from '@/battle/battle.entity';
import { Problem } from '@/problem/problem.entity';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { RedisKeys } from '@/redis/redis-key.constant';
import { Submission } from '@/submission/submission.entity';

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
    @InjectRepository(Battle)
    private readonly battleRepository: Repository<Battle>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
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
    manager?: EntityManager,
  ): Promise<{ winner: RatingUpdateResult; loser: RatingUpdateResult }> {
    // 트랜잭션 매니저가 있으면 사용, 없으면 기본 repository 사용
    const userRepo = manager?.getRepository(User) ?? this.userRepository;

    const winner = await userRepo.findOne({ where: { id: winnerId } });
    const loser = await userRepo.findOne({ where: { id: loserId } });

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
    await userRepo.update(winnerId, {
      rating: winnerNewRating,
      rd: winnerNewRd,
      volatility: winnerPlayer.getVol(),
      tier: winnerNewTier,
      wins: isDraw ? winner.wins : winner.wins + 1,
      draws: isDraw ? winner.draws + 1 : winner.draws,
    });

    await userRepo.update(loserId, {
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

  // 사용자 배틀 기록 조회
  async getBattleHistory(userId: string): Promise<BattleHistoryItem[]> {
    // 배틀 목록 조회
    const battles = await this.battleRepository
      .createQueryBuilder('battle')
      .where('FIND_IN_SET(:userId, battle.playerIds) > 0', { userId })
      .orderBy('battle.createdAt', 'DESC')
      .getMany();

    if (battles.length === 0) {
      return [];
    }

    // 필요한 ID 수집
    const opponentIds = [
      ...new Set(
        battles
          .map((b) => b.playerIds.find((id) => id !== userId))
          .filter((id): id is string => !!id),
      ),
    ];
    const problemIds = [...new Set(battles.map((b) => b.problemId))];
    const battleIds = battles.map((b) => b.id);

    // 한 번에 조회
    const opponents: Pick<User, 'id' | 'username'>[] =
      opponentIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(opponentIds) },
            select: ['id', 'username'],
          })
        : [];

    const [problems, submissions] = await Promise.all([
      this.problemRepository.find({
        where: { id: In(problemIds) },
        select: ['id', 'title', 'difficulty', 'testcases'],
      }),
      this.submissionRepository
        .createQueryBuilder('submission')
        .where('submission.userId = :userId', { userId })
        .andWhere('submission.battleId IN (:...battleIds)', { battleIds })
        .orderBy('submission.createdAt', 'DESC')
        .getMany(),
    ]);

    const opponentMap = new Map(opponents.map((u) => [u.id, u] as const));
    const problemMap = new Map(problems.map((p) => [p.id, p] as const));
    // 각 배틀당 가장 최근 제출만 매핑
    const submissionMap = new Map<string, Submission>();
    for (const sub of submissions) {
      if (!submissionMap.has(sub.battleId)) {
        submissionMap.set(sub.battleId, sub);
      }
    }

    // 결과 조합
    return battles.map((battle) => {
      let result: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
      if (battle.winnerId) {
        result = battle.winnerId === userId ? 'WIN' : 'LOSS';
      }

      // 상대방 정보
      const opponentId = battle.playerIds.find((id) => id !== userId);
      const opponent = opponentId ? opponentMap.get(opponentId) : null;

      // 문제 정보
      const problem = problemMap.get(battle.problemId);

      // 내 제출 정보
      const mySubmission = submissionMap.get(battle.id);

      // 점수 변화량
      const playerIndex = battle.playerIds.indexOf(userId);
      const ratingChange =
        playerIndex === 0 ? battle.player1RatingChange : battle.player2RatingChange;

      return {
        id: battle.id,
        result,
        opponentName: opponent?.username || '알 수 없는 유저',
        problem: {
          title: problem?.title || '삭제된 문제',
          difficulty: problem?.difficulty || 'Unknown',
        },
        submission: mySubmission
          ? {
              language: mySubmission.language,
              passedTestCases: mySubmission.passedTestCases,
              totalTestCases: mySubmission.totalTestCases ?? (problem?.testcases?.length || 0),
            }
          : null,
        ratingChange: ratingChange || 0,
        createdAt: battle.createdAt,
      };
    });
  }

  // 마이페이지 제출 이력 조회
  async getSubmissionHistory(userId: string): Promise<SubmissionHistoryItem[]> {
    const submissions = await this.submissionRepository
      .createQueryBuilder('submission')
      .innerJoin(Problem, 'problem', 'submission.problemId = problem.id')
      .select([
        'submission.id AS id',
        'submission.problemId AS problemId',
        'submission.createdAt AS createdAt',
        'problem.title AS problemTitle',
        'problem.difficulty AS difficulty',
      ])
      .where('submission.userId = :userId', { userId })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(innerSub.id)')
          .from(Submission, 'innerSub')
          .where('innerSub.userId = :userId')
          .groupBy('innerSub.battleId')
          .getQuery();
        return `submission.id IN ${subQuery}`;
      })
      .orderBy('submission.createdAt', 'DESC')
      .getRawMany();

    return submissions.map(
      (sub: {
        id: string;
        problemId: string;
        problemTitle: string;
        difficulty: string;
        createdAt: string;
      }) => ({
        id: sub.id,
        problemId: sub.problemId,
        problemTitle: sub.problemTitle,
        difficulty: sub.difficulty,
        createdAt: new Date(sub.createdAt),
      }),
    );
  }
}
