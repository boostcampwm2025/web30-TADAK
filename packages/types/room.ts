import type { RoomUser, UserRole } from './user';

export type RoomStatus = 'waiting' | 'in-battle';

export interface Room {
  roomId: string;
  title: string;
  hostId: string;
  status: RoomStatus;
  createdAt: Date;
  settings: RoomSettings;
  // 현재 접속한 유저 리스트
  currentPlayers: RoomUser[];
  currentSpectators: RoomUser[];
}

// 방 설정(방 생성)
export interface RoomSettings {
  maxPlayers: number;
  password?: string;
  timeout?: number;
}

export interface RoomCreateDTO {
  title: string;
  hostId: string;
  settings: RoomSettings;
}

// === Socket DTOs ===

// CHECK_ROOM_AVAILABILITY_REQUEST DTO
export interface RoomAvailabilityRequestDTO {
  roomId: string;
}
// ROOM_AVAILABILITY_RESPONSE DTO
export interface RoomAvailabilityResponseDTO {
  roomId: string;
  playerCount: number;
  isAvailable: boolean;
}

// 방 입장 요청/응답
export interface JoinRoomRequest {
  roomId: string;
  requestedRole: UserRole;
}

export interface JoinRoomResponse {
  roomId: string;
  role: UserRole;
}

// ROOM_STATE_ROLE payload (server -> client after join)
export interface RoomStateSyncPayload {
  roomId: string;
  role: UserRole;
  userId: string;
  username: string;
  battleId?: string;
}

export interface RoomPlayerPayload {
  roomId: string;
  players: RoomUser[];
}
