import type { TierType } from './user';

export type BattleStatus = 'running' | 'completed';

export type BattleResult = 'win' | 'lose' | 'draw';

export interface Battle {
  battleId: string;
  roomId: string;
  problemId: string;
  status: BattleStatus;

  config: {
    duration: number;
  };
  startedAt?: Date;
  endedAt?: Date;

  users: BattleUser[];
}

export interface BattleUser {
  userId: string;
  battleId: string;
  code: string;
  language: string;

  progress: {
    passedCount: number;
    totalCount: number;
  };

  isConnected: boolean;
  isFinished: boolean;
  finishedAt?: Date;
  disconnectedAt?: Date;

  result?: BattleResult;
}

export interface CreateBattleDTO {
  roomId: string;
  config: {
    duration?: number;
  };
  users: string[];
}

export interface UpdateBattleUserDTO {
  userId: string;
  battleId: string;
  code?: string;

  progress: {
    passedCount: number;
    totalCount: number;
  };
  isFinished?: boolean;
}

export interface UpdateUserCodeDTO {
  roomId: string;
  userId: string;
  code: string;
  language: string;
}

export interface UserTestResultPayload {
  roomId: string;
  userId: string;
  username?: string;
  passed: boolean;
}

export interface UserFinishedPayload {
  roomId: string;
  userId: string;
  username?: string;
}

export interface BattleResultResponse {
  battle: {
    id: string;
    winnerId: string;
  };
  players: Array<{
    userId: string;
    username: string;
    avatarUrl: string;
    tier: TierType;
    division: number;
    rate: number;
    score: number;
    totalScore: number;
    time: string;
    code: string;
    ratingChange: number;
  }>;
}
