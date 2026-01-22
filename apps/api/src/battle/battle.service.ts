import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';
import { UserService } from '@/user/user.service';

@Injectable()
export class BattleService {
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
  ) {}

  async createBattle(dto: CreateBattleDTO): Promise<Battle> {
    // TODO: 배틀 ID 생성 로직 추가
    const battleId = `battle-${Date.now()}`;

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
        duration: problem.battleTimeLimit || BATTLE_CONFIG.DURATION,
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

  // 배틀 나가기
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
    // 1. Redis에서 배틀 데이터 조회
    const battle = await this.battleRedisService.getBattle(battleId);
    if (!battle) {
      throw new Error(`Battle not found: ${battleId}`);
    }

    // 2. 승자 결정
    // 먼저 완료한 사람이 있으면 그 사람이 승자
    const finishedUsers = battle.users
      .filter((user) => user.isFinished && user.finishedAt)
      .sort((a, b) => {
        const timeA = a.finishedAt ? new Date(a.finishedAt).getTime() : Infinity;
        const timeB = b.finishedAt ? new Date(b.finishedAt).getTime() : Infinity;
        return timeA - timeB;
      });

    let winner = finishedUsers.length > 0 ? finishedUsers[0] : null;

    // 완료한 사람이 없으면 가장 많은 테스트를 통과한 사람이 승자
    if (!winner) {
      const sortedByScore = [...battle.users].sort((a, b) => {
        return b.progress.passedCount - a.progress.passedCount;
      });

      // 동점 체크: 1등과 2등의 점수가 같으면 무승부 (winner = null)
      if (
        sortedByScore.length > 1 &&
        sortedByScore[0].progress.passedCount === sortedByScore[1].progress.passedCount
      ) {
        winner = null;
      } else {
        // 점수가 더 높은 사람이 승자 (0점이라도 상대보다 높으면 승자)
        winner = sortedByScore[0];
      }
    }

    const loser =
      winner && battle.users.length > 1
        ? battle.users.find((u) => u.userId !== winner.userId)
        : null;

    // 3. 각 참가자의 제출 기록 저장
    const submissionPromises = battle.users.map(async (user) => {
      // 승패 결과 결정
      let status = 'FAILED';
      if (user.isFinished) {
        status = 'ACCEPTED';
      }

      const submission = this.submissionRepository.create({
        problemId: battle.problemId,
        userId: user.userId,
        battleId: battle.battleId,
        code: user.code,
        language: user.language,
        status,
        passedTestCases: user.progress.passedCount,
        totalTestCases: user.progress.totalCount,
      });

      return this.submissionRepository.save(submission);
    });

    const savedSubmissions = await Promise.all(submissionPromises);

    // 4. 배틀 엔티티 생성 및 저장
    const winnerSubmission = winner
      ? savedSubmissions.find((s) => s.userId === winner.userId)
      : null;
    const loserSubmission = loser ? savedSubmissions.find((s) => s.userId === loser.userId) : null;

    const battleEntity = new BattleEntity();
    battleEntity.id = battle.battleId;
    battleEntity.problemId = battle.problemId;
    battleEntity.startedAt = battle.startedAt ? new Date(battle.startedAt) : new Date();
    battleEntity.winnerId = winner?.userId || null;
    battleEntity.winnerSubmissionId = winnerSubmission?.id || null;
    battleEntity.loserSubmissionId = loserSubmission?.id || null;
    battleEntity.playerIds = battle.users.map((u) => u.userId);

    const savedBattle = await this.battleRepository.save(battleEntity);

    // 4.5 유저 점수 업데이트
    let winnerId: string = '';
    let loserId: string = '';
    if (winner && loser) {
      winnerId = winner.userId;
      loserId = loser.userId;
    } else {
      winnerId = battle.users[0].userId;
      loserId = battle.users[1].userId;
    }
    await this.userService.updateRatings(winnerId, loserId, winner ? false : true);

    // 5. Redis에서 배틀 데이터 삭제
    await this.battleRedisService.deleteBattle(battle.battleId, battle.roomId);

    // 6. 진행 중인 배틀 목록에서 제거
    await this.redisClient.srem(RedisKeys.activeBattles(), battle.battleId);

    // 7. 참가자들의 매칭 상태 초기화 (재매칭 가능하도록)
    await Promise.all(
      battle.users.map((user) => this.matchingService.clearUserMatchingStatus(user.userId)),
    );

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
  // 배틀 결과 조회
  async getBattleResult(battleId: string): Promise<BattleResultResponse> {
    // Battle 정보 조회
    const battle = await this.battleRepository.findOne({ where: { id: battleId } });

    if (!battle) {
      throw new Error('배틀 정보를 찾을 수 없습니다.');
    }

    // 참가자 목록
    const playerIds = battle.playerIds;

    // 제출 조회
    const submissionIds = [battle.winnerSubmissionId, battle.loserSubmissionId].filter(Boolean);
    const submissions =
      submissionIds.length > 0
        ? await this.submissionRepository
            .createQueryBuilder('submission')
            .whereInIds(submissionIds)
            .getMany()
        : [];

    const submissionMap = new Map(submissions.map((sub) => [sub.userId, sub]));

    // User 정보 조회
    const users = await this.userRepository
      .createQueryBuilder('user')
      .whereInIds(playerIds)
      .getMany();

    const userMap = new Map(users.map((user) => [user.id, user]));

    const players = playerIds.map((userId) => {
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

      return {
        userId,
        username: user?.username || 'Unknown',
        avatarUrl: user?.avatarUrl || '',
        tier,
        rate: user?.rating || 0,
        score: submission?.passedTestCases || 0,
        totalScore: submission?.totalTestCases || 20,
        time,
        code: submission?.code || '',
      };
    });

    return {
      battle: {
        id: battle.id,
        winnerId: battle.winnerId,
      },
      players,
    };
  }
}
