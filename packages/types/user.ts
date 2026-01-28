export type UserRole = 'player' | 'spectator';
export type TierType = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';

export interface UserStats {
  wins: number;
  losses: number;
  rating: number;
  tier: { tier: TierType; division: number };
}

// 방에 들어가지 않은 사용자
export interface User {
  userId: string;
  username: string;
  avatarUrl?: string;
}

// 방에 들어간 사용자
export interface RoomUser extends User {
  roomId: string;
  socketId: string;
  role: UserRole;
  joinedAt: Date;
  stats?: UserStats;
}
