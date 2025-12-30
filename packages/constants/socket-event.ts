// 소켓 네임스페이스 (Namespaces)
// 기능별로 소켓 연결 분리

export const SOCKET_NAMESPACE = {
  GAME: '/game', // 게임 및 방 관리 로직
  CHAT: '/chat', // (나중에 채팅이 분리된다면 사용)
} as const;

// 소켓 이벤트 이름 (Event Names)
// 클라이언트와 서버가 주고받는 메시지 키값입니다.
// 오타 방지를 위해 가장 중요합니다.

export const SOCKET_EVENT = {
  // === Connection ===
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // --- Client -> Server (요청) ---
  CHECK_ROOM_AVAILABILITY: 'check-room-availability', // 방 인원 확인
  JOIN_ROOM: 'join-room', // 방 입장 (Player/Spectator)
  LEAVE_ROOM: 'leave-room', // 방 나가기

  // --- Server -> Client (응답/알림) ---
  ROOM_AVAILABILITY: 'room-availability', // 방 인원 확인 결과
  ROOM_STATE_ROLE: 'room-state-role', // 방 입장 시 역할 부여
  ROOM_PLAYERS: 'room-players', // 현재 방 참가자 전체 목록
  ROOM_USER_JOINED: 'room-joined', // 새 유저 입장 알림
  ROOM_USER_LEFT: 'room-left', // 유저 퇴장 알림
  ERROR: 'error', // 에러 발생
} as const;

// 룸 설정 상수 (Room Settings)
// 하드코딩 피하기 위한 설정값들입니다.
export const ROOM_CONFIG = {
  MAX_PLAYERS: 2, // 1:1 대전이므로 플레이어는 최대 2명
} as const;

// 에러 메시지/코드 (Error Constants)
// 클라이언트에서 에러별로 다른 UI를 보여줘야 할 때 사용합니다.
export const SOCKET_ERROR = {
  ROOM_FULL: 'ROOM_FULL', // 방이 꽉 찼을 때
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND', // 존재하지 않는 방일 때
  INVALID_ROLE: 'INVALID_ROLE', // 잘못된 역할(Role) 요청일 때
  UNKNOWN: 'UNKNOWN_ERROR', // 기타 알 수 없는 에러
} as const;
