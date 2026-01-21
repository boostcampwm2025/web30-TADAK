import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BATTLE_CONFIG } from '@packages/constants/battle';
import {
  Battle,
  BattleResultResponse,
  BattleUser,
  CreateBattleDTO,
  UpdateUserCodeDTO,
} from '@packages/types/battle';
import { RoomUser } from '@packages/types/user';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { Battle as BattleEntity } from '@/battle/battle.entity';
import { BattleRedisService } from '@/battle/battle-redis.service';
import { ProblemService } from '@/problem/problem.service';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { RedisKeys } from '@/redis/redis-key.constant';
import { Submission } from '@/submission/submission.entity';
import { User } from '@/user/user.entity';

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

      return {
        userId,
        username: user?.username || 'Unknown',
        avatarUrl: user?.avatarUrl || '',
        tier: user?.tier?.tier || 'Bronze',
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
