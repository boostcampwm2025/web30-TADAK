import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BATTLE_CONFIG } from '@packages/constants/battle';
import {
  Battle,
  BattleResultResponse,
  BattleUser,
  CreateBattleDTO,
  UpdateUserCodeDTO,
} from '@packages/types/battle';
import { Tier } from '@packages/types/matching';
import { RoomUser } from '@packages/types/user';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { Battle as BattleEntity } from '@/battle/battle.entity';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { MatchingService } from '@/matching/matching.service';
import { ProblemService } from '@/problem/problem.service';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { RedisKeys } from '@/redis/redis-key.constant';
import { RoomService } from '@/room/room.service';
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';
import { UserService } from '@/user/user.service';

@Injectable()
export class BattleService {
  private readonly logger = new Logger(BattleService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly battleRedisService: BattleRedisService,
    private readonly problemService: ProblemService,
    @InjectRepository(BattleEntity)
    private readonly battleRepository: Repository<BattleEntity>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => MatchingService))
    private readonly matchingService: MatchingService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  async createBattle(dto: CreateBattleDTO): Promise<Battle> {
    // 배틀 ID 생성 로직 추가
    const battleId = `battle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 임시 문제 선택
    const problem = await this.problemService.findFirst();
    if (!problem) {
      throw new Error('No problems available.');
    }

    const users: BattleUser[] = dto.users.map((userId) => ({
      userId,
      battleId,
      code: '',
      language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
      progress: {
        passedCount: 0,
        totalCount: Array.isArray(problem.testcases) ? (problem.testcases as any[]).length : 0,
      },
      isConnected: true,
      isFinished: false,
    }));

    const battle: Battle = {
      battleId,
      roomId: dto.roomId,
      problemId: problem.id,
      status: 'running',
      config: {
        // duration: problem.battleTimeLimit || BATTLE_CONFIG.DURATION,
        duration: 5 * 60,
      },
      startedAt: new Date(),
      users,
    };

    await this.battleRedisService.createBattle(battle);

    return battle;
  }

  // 배틀 입장
  async joinBattle(roomId: string, user: RoomUser): Promise<Battle | null> {
    const battleId = await this.battleRedisService.getBattleIdByRoomId(roomId);
    if (!battleId) return null;

    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) return null;

    // TODO: 참가자 or 관전자 구분 로직 추가
    // 현재는 모두 참가자로 간주
    const existingUser = battle.users.find((u) => u.userId === user.userId);
    if (existingUser) {
      existingUser.isConnected = true;
      existingUser.disconnectedAt = undefined;
    } else {
      const newBattleUser: BattleUser = {
        userId: user.userId,
        battleId: battle.battleId,
        code: '',
        language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
        progress: {
          passedCount: 0,
          totalCount: 0,
        },
        isConnected: true,
        isFinished: false,
      };

      battle.users.push(newBattleUser);
    }

    await this.battleRedisService.updateBattle(battle);

    return battle;
  }

  // 배틀 나가기 (단순 퇴장, 배틀은 계속)
  async leaveBattle(roomId: string, userId: string): Promise<Battle | null> {
    const battleId = await this.battleRedisService.getBattleIdByRoomId(roomId);
    if (!battleId) return null;

    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) return null;

    // MVP 단계에서는 배틀 퇴장시 배틀 참가자에서 제외
    // TODO: 참가자 다시 입장시 복구 로직 추가 (disconnectedAt 등 활용)
    battle.users = battle.users.filter((u) => u.userId !== userId);

    await this.battleRedisService.updateBattle(battle);

    // 퇴장한 사용자의 매칭 상태 초기화
    await this.matchingService.clearUserMatchingStatus(userId);

    return battle;
  }

  async getBattle(battleId: string): Promise<Battle | null> {
    // TODO: 권한 체크 추가 (사용자가 해당 배틀에 접근 가능한지 또는 비밀번호 존재 등)
    return this.battleRedisService.getBattle(battleId);
  }

  async getBattleByRoomId(roomId: string): Promise<Battle | null> {
    const battleId = await this.battleRedisService.getBattleIdByRoomId(roomId);
    if (!battleId) return null;
    return this.battleRedisService.getBattle(battleId);
  }

  async updateUserCode(dto: UpdateUserCodeDTO): Promise<Battle | null> {
    // TODO: 권한 체크 추가 (해당 userId가 코드를 수정할 권한이 있는지)
    // TODO: 배틀 상태 검증 (종료된 배틀은 수정 불가)

    const battleId = await this.battleRedisService.getBattleIdByRoomId(dto.roomId);
    if (!battleId) return null;

    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) return null;

    const user = battle.users.find((u) => u.userId === dto.userId);
    if (!user) return null;

    user.code = dto.code;
    user.language = dto.language;

    await this.battleRedisService.updateBattle(battle);

    return battle;
  }

  async updateUserProgress(
    battleId: string,
    userId: string,
    passedCount: number,
    totalCount: number,
  ): Promise<void> {
    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) return;

    const user = battle.users.find((u) => u.userId === userId);
    if (user) {
      user.progress = {
        passedCount,
        totalCount,
      };
      await this.battleRedisService.updateBattle(battle);
    }
  }

  async deleteBattle(roomId: string): Promise<void> {
    const battleId = await this.battleRedisService.getBattleIdByRoomId(roomId);
    if (battleId) {
      await this.battleRedisService.deleteBattle(battleId, roomId);
    }
  }

  async getSocketIdByUserId(userId: string): Promise<string | null> {
    const socketId = await this.redisClient.hget(RedisKeys.matchingUser(userId), 'socketId');

    return socketId;
  }

  /**
   * 배틀 종료 처리: DB에 저장하고 Redis에서 삭제
   * @param battleId 종료할 배틀 ID
   * @returns 저장된 배틀 엔티티
   */
  async endBattle(battleId: string): Promise<BattleEntity> {
    this.logger.log(`[endBattle] 시작 - battleId: ${battleId}`);

    // 1. Redis에서 배틀 데이터 조회
    const battle = await this.battleRedisService.getBattle(battleId);
    this.logger.log(`[endBattle] Redis 배틀 데이터 조회 완료 - battle: ${JSON.stringify(battle)}`);
    if (!battle) {
      this.logger.error(`[endBattle] 배틀을 찾을 수 없음 - battleId: ${battleId}`);
      throw new Error(`Battle not found: ${battleId}`);
    }

    // 2. 각 참가자의 마지막 제출 기록 조회
    const lastSubmissions = await Promise.all(
      battle.users.map(async (user) => {
        const submission = await this.submissionRepository.findOne({
          where: { battleId: battle.battleId, userId: user.userId },
          order: { createdAt: 'DESC' },
        });
        return { odUserId: user.userId, submission };
      }),
    );
    this.logger.log(
      `[endBattle] 마지막 제출 조회 완료 - ${JSON.stringify(
        lastSubmissions.map((s) => ({
          odUserId: s.odUserId,
          submissionId: s.submission?.id || null,
          passedTestCases: s.submission?.passedTestCases || 0,
          status: s.submission?.status || null,
        })),
      )}`,
    );

    // 3. 승자 결정 (submission 기반)
    // ACCEPTED 상태인 사람이 있으면 그 사람이 승자 (먼저 제출한 사람 우선)
    const acceptedSubmissions = lastSubmissions
      .filter((s) => s.submission?.status === 'ACCEPTED')
      .sort((a, b) => {
        const timeA = a.submission?.createdAt
          ? new Date(a.submission.createdAt).getTime()
          : Infinity;
        const timeB = b.submission?.createdAt
          ? new Date(b.submission.createdAt).getTime()
          : Infinity;
        return timeA - timeB;
      });

    let winnerId: string | null = null;
    let loserId: string | null = null;

    if (acceptedSubmissions.length > 0) {
      // ACCEPTED가 있으면 먼저 ACCEPTED한 사람이 승자
      winnerId = acceptedSubmissions[0].odUserId;
      loserId = battle.users.find((u) => u.userId !== winnerId)?.userId || null;
      this.logger.log(`[endBattle] ACCEPTED 기준 승자 결정 - winnerId: ${winnerId}`);
    } else {
      // ACCEPTED가 없으면 passedTestCases가 많은 사람이 승자
      const sortedByScore = [...lastSubmissions].sort((a, b) => {
        const scoreA = a.submission?.passedTestCases || 0;
        const scoreB = b.submission?.passedTestCases || 0;
        return scoreB - scoreA;
      });

      const firstScore = sortedByScore[0]?.submission?.passedTestCases || 0;
      const secondScore = sortedByScore[1]?.submission?.passedTestCases || 0;

      if (firstScore === secondScore) {
        // 동점이면 무승부
        winnerId = null;
        loserId = null;
        this.logger.log(
          `[endBattle] 동점 무승부 - firstScore: ${firstScore}, secondScore: ${secondScore}`,
        );
      } else {
        winnerId = sortedByScore[0].odUserId;
        loserId = sortedByScore[1]?.odUserId || null;
        this.logger.log(
          `[endBattle] 점수 기준 승자 결정 - winnerId: ${winnerId}, firstScore: ${firstScore}, secondScore: ${secondScore}`,
        );
      }
    }

    this.logger.log(
      `[endBattle] 최종 승자 결정 완료 - winnerId: ${winnerId || 'null'}, loserId: ${loserId || 'null'}`,
    );

    const winnerSubmission = winnerId
      ? lastSubmissions.find((s) => s.odUserId === winnerId)?.submission || null
      : null;
    const loserSubmission = loserId
      ? lastSubmissions.find((s) => s.odUserId === loserId)?.submission || null
      : null;

    const isDraw = winnerId === null;
    const finalWinnerId = winnerId || battle.users[0].userId;
    const finalLoserId = loserId || battle.users[1].userId;
    this.logger.log(
      `[endBattle] 점수 업데이트 시작 - finalWinnerId: ${finalWinnerId}, finalLoserId: ${finalLoserId}, isDraw: ${isDraw}`,
    );
    const ratingResult = await this.userService.updateRatings(finalWinnerId, finalLoserId, isDraw);

    // 4. 배틀 엔티티 생성 및 저장
    const battleEntity = new BattleEntity();
    battleEntity.id = battle.battleId;
    battleEntity.problemId = battle.problemId;
    battleEntity.startedAt = battle.startedAt ? new Date(battle.startedAt) : new Date();
    battleEntity.winnerId = winnerId;
    battleEntity.winnerSubmissionId = winnerSubmission?.id || null;
    battleEntity.loserSubmissionId = loserSubmission?.id || null;
    battleEntity.playerIds = battle.users.map((u) => u.userId);

    const player1Id = battle.users[0].userId;
    battleEntity.player1RatingChange =
      finalWinnerId === player1Id
        ? ratingResult.winner.ratingDelta
        : ratingResult.loser.ratingDelta;
    battleEntity.player2RatingChange =
      finalWinnerId === player1Id
        ? ratingResult.loser.ratingDelta
        : ratingResult.winner.ratingDelta;

    const savedBattle = await this.battleRepository.save(battleEntity);
    this.logger.log(`[endBattle] 배틀 엔티티 저장 완료 - savedBattle.id: ${savedBattle.id}`);

    // 5. Redis에서 배틀 데이터 삭제
    this.logger.log(`[endBattle] Redis 배틀 데이터 삭제 시작`);
    await this.battleRedisService.deleteBattle(battle.battleId, battle.roomId);
    this.logger.log(`[endBattle] Redis 배틀 데이터 삭제 완료`);

    // 6. 진행 중인 배틀 목록에서 제거
    await this.redisClient.srem(RedisKeys.activeBattles(), battle.battleId);
    this.logger.log(`[endBattle] 진행 중인 배틀 목록에서 제거 완료`);

    // 6.5. 방 삭제
    await this.roomService.deleteRoom(battle.roomId);

    // 7. 참가자들의 매칭 상태 초기화 (재매칭 가능하도록)
    this.logger.log(
      `[endBattle] 매칭 상태 초기화 시작 - users: ${battle.users.map((u) => u.userId).join(', ')}`,
    );
    await Promise.all(
      battle.users.map((user) => this.matchingService.clearUserMatchingStatus(user.userId)),
    );
    this.logger.log(`[endBattle] 매칭 상태 초기화 완료`);

    this.logger.log(`[endBattle] 종료 - battleId: ${battleId}`);
    return savedBattle;
  }

  /**
   * 사용자가 모든 테스트를 통과했을 때 호출 (즉시 승리)
   * @param battleId 배틀 ID
   * @param userId 완료한 사용자 ID
   */
  async markUserFinished(battleId: string, userId: string): Promise<BattleEntity> {
    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) {
      throw new Error(`Battle not found: ${battleId}`);
    }

    const user = battle.users.find((u) => u.userId === userId);
    if (!user) {
      throw new Error(`User not found in battle: ${userId}`);
    }

    // Redis 업데이트
    user.isFinished = true;
    user.finishedAt = new Date();
    await this.battleRedisService.updateBattle(battle);

    // 한 명이라도 완료하면 즉시 배틀 종료
    return this.endBattle(battleId);
  }

  /**
   * 타이머 종료 시 호출 (점수 기반 승리)
   * @param battleId 배틀 ID
   */
  async endBattleByTimeout(battleId: string): Promise<BattleEntity> {
    // endBattle 메서드가 자동으로 점수 기반 승자 결정을 처리함
    return this.endBattle(battleId);
  }

  // 사용자가 배틀을 나갔을 때 호출
  async forfeitBattle(battleId: string, forfeiterUserId: string): Promise<BattleEntity> {
    this.logger.log(
      `[forfeitBattle] 시작 - battleId: ${battleId}, forfeiterUserId: ${forfeiterUserId}`,
    );

    // Redis에서 배틀 데이터 조회
    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) {
      this.logger.error(`[forfeitBattle] 배틀을 찾을 수 없음 - battleId: ${battleId}`);
      throw new Error(`Battle not found: ${battleId}`);
    }

    // 상대방 찾기 (나간 사람이 아닌 사람)
    const opponent = battle.users.find((user) => user.userId !== forfeiterUserId);
    if (!opponent) {
      this.logger.error(
        `[forfeitBattle] 상대방을 찾을 수 없음 - forfeiterUserId: ${forfeiterUserId}`,
      );
      throw new Error('Opponent not found in battle');
    }

    // 승자 결정 및 레이팅 업데이트
    const winnerId = opponent.userId;
    const loserId = forfeiterUserId;
    const ratingResult = await this.userService.updateRatings(winnerId, loserId, false);

    // 마지막 제출 기록 조회 (있으면 저장)
    const winnerSubmission = await this.submissionRepository.findOne({
      where: { battleId: battle.battleId, userId: winnerId },
      order: { createdAt: 'DESC' },
    });
    const loserSubmission = await this.submissionRepository.findOne({
      where: { battleId: battle.battleId, userId: loserId },
      order: { createdAt: 'DESC' },
    });

    // 배틀 엔티티 생성 및 저장
    const battleEntity = new BattleEntity();
    battleEntity.id = battle.battleId;
    battleEntity.problemId = battle.problemId;
    battleEntity.startedAt = battle.startedAt ? new Date(battle.startedAt) : new Date();
    battleEntity.winnerId = winnerId;
    battleEntity.winnerSubmissionId = winnerSubmission?.id || null;
    battleEntity.loserSubmissionId = loserSubmission?.id || null;
    battleEntity.playerIds = battle.users.map((u) => u.userId);

    const player1Id = battle.users[0].userId;
    battleEntity.player1RatingChange =
      winnerId === player1Id ? ratingResult.winner.ratingDelta : ratingResult.loser.ratingDelta;
    battleEntity.player2RatingChange =
      winnerId === player1Id ? ratingResult.loser.ratingDelta : ratingResult.winner.ratingDelta;

    const savedBattle = await this.battleRepository.save(battleEntity);

    // 배틀 및 방 삭제
    await this.battleRedisService.deleteBattle(battle.battleId, battle.roomId);
    await this.redisClient.srem(RedisKeys.activeBattles(), battle.battleId);
    await this.roomService.deleteRoom(battle.roomId);

    // 참가자들의 매칭 상태 초기화
    await Promise.all(
      battle.users.map((user) => this.matchingService.clearUserMatchingStatus(user.userId)),
    );

    this.logger.log(`[forfeitBattle] 종료 - battleId: ${battleId}`);
    return savedBattle;
  }

  // 배틀 결과 조회
  async getBattleResult(battleId: string): Promise<BattleResultResponse> {
    // Battle 정보 조회
    const battle = await this.battleRepository.findOne({ where: { id: battleId } });

    if (!battle) {
      throw new Error('배틀 정보를 찾을 수 없습니다.');
    }

    // 참가자 목록
    const playerIds = battle.playerIds;

    // 제출 조회: 승부가 난 경우 id로 조회, 무승부인 경우 각 유저별 최신 제출 조회
    const submissionIds = [battle.winnerSubmissionId, battle.loserSubmissionId].filter(Boolean);
    let submissions: Submission[];

    if (submissionIds.length > 0) {
      submissions = await this.submissionRepository
        .createQueryBuilder('submission')
        .whereInIds(submissionIds)
        .getMany();
    } else {
      submissions = await Promise.all(
        playerIds.map(async (userId) => {
          const submission = await this.submissionRepository.findOne({
            where: { battleId, userId },
            order: { createdAt: 'DESC' },
          });
          return submission;
        }),
      ).then((results) => results.filter((sub) => sub !== null));
    }

    const submissionMap = new Map(submissions.map((sub) => [sub.userId, sub]));

    // User 정보 조회
    const users = await this.userRepository
      .createQueryBuilder('user')
      .whereInIds(playerIds)
      .getMany();

    const userMap = new Map(users.map((user) => [user.id, user]));

    const players = playerIds.map((userId, index) => {
      const user = userMap.get(userId);
      const submission = submissionMap.get(userId);

      if (!user) {
        console.warn(`유저 정보 없음 (ID: ${userId})`);
      }

      let time = '-';
      if (submission) {
        const timeElapsed = submission.createdAt.getTime() - battle.startedAt.getTime();
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor((timeElapsed % 60000) / 1000);
        time = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      const tier = (user?.tier?.tier || 'Bronze') as Tier;
      const division = user?.tier?.division ?? 4;

      const ratingChange =
        index === 0 ? battle.player1RatingChange || 0 : battle.player2RatingChange || 0;

      return {
        userId,
        username: user?.username || 'Unknown',
        avatarUrl: user?.avatarUrl || '',
        tier,
        division,
        rate: user?.rating || 0,
        score: submission?.passedTestCases || 0,
        totalScore: submission?.totalTestCases || 20,
        time,
        code: submission?.code || '',
        ratingChange,
      };
    });

    return {
      battle: {
        id: battle.id,
        winnerId: battle.winnerId || '',
      },
      players,
    };
  }
}
