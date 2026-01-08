export type MatchingStatus = 'WAITING' | 'MATCHED' | 'CANCELED';
export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER';
export type TierDivision = 1 | 2 | 3 | 4;
export interface UserTier {
  tier: Tier;
  division?: TierDivision;
}

export interface MatchingUser {
  userId: string;
  username: string;
  rating: number;
  tier: UserTier;
  status: MatchingStatus;
  waitingSince: Date;
  socketId: string;
}

export interface MatchingStartRequest {
  userId: string;
  socketId: string;
  // rating, username은 서버에서 세션 조회나 DB 조회
}

export interface MatchingCancelRequest {
  userId: string;
}

export interface UserRate {
  win: number;
  lose: number;
  draw?: number;
  winRate: number;
}

export interface MatchingSuccessResponse {
  roomId: string;
  battleId: string;
  myRate: UserRate;

  opponent: {
    userId: string;
    username: string;
    avatarUrl: string;
    rating: number;
    tier: UserTier;
    rate: UserRate;
  };
}
