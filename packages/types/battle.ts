export type BattleStatus = 'running' | 'completed';

export type BattleResult = 'win' | 'lose' | 'draw';

export interface Battle {
  battleId: string;
  roomId: string;
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
