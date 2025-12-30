export type UserRole = 'player' | 'spectator';

// 방에 들어가지 않은 사용자
export interface User {
  userId: string;
  username: string;
}

// 방에 들어간 사용자
export interface RoomUser extends User {
  roomId: string;
  socketId: string;
  role: UserRole;
  joinedAt: Date;
}
