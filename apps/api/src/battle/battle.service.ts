import { Injectable } from '@nestjs/common';
import { BATTLE_CONFIG } from '@packages/constants/battle';
import { Battle, BattleUser, CreateBattleDTO, UpdateUserCodeDTO } from '@packages/types/battle';
import { RoomUser } from '@packages/types/user';

import { BattleRedisService } from '@/battle/battle-redis.service';

@Injectable()
export class BattleService {
  constructor(private readonly battleRedisService: BattleRedisService) {}

  async createBattle(dto: CreateBattleDTO): Promise<Battle> {
    // TODO: 배틀 ID 생성 로직 추가
    const battleId = `battle-${Date.now()}`;

    const users: BattleUser[] = dto.users.map((userId) => ({
      userId,
      battleId,
      code: '',
      language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
      progress: {
        passedCount: 0,
        totalCount: 0,
      },
      isConnected: true,
      isFinished: false,
    }));

    const battle: Battle = {
      battleId,
      roomId: dto.roomId,
      status: 'running',
      config: {
        duration: dto.config.duration || BATTLE_CONFIG.DURATION,
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
}
