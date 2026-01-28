import { SOCKET_ERROR, SOCKET_EVENT } from '@shared/constants/socket-event';
import type {
  JoinRoomRequest,
  JoinRoomResponse,
  RoomAvailabilityRequestDTO,
  RoomAvailabilityResponseDTO,
  RoomPlayerPayload,
  RoomStateSyncPayload,
} from '@shared/types/room';
import type { Room } from '@shared/types/room';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';

import { connectBattleSocket, disconnectBattleSocket } from '../lib/battleSocket';
import { useRoomStore } from './roomStore';
import { useUserStore } from './userStore';

const SESSION_KEY = 'battle-session';

type StoredSession = {
  roomId: string;
  role: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
};

const saveSession = (session: StoredSession) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
};

const loadSession = (): StoredSession | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

interface BattleSocketState {
  socket: Socket | null;
  isConnected: boolean;
  roomAvailability: RoomAvailabilityResponseDTO | null;
  spectatorCount: number;
  rooms: Room[];
  availabilityListener: ((payload: RoomAvailabilityResponseDTO) => void) | null;
  roomListListener: ((rooms: Room[]) => void) | null;
  joinedListener:
    | ((payload: { roomId: string; playerCount: number; spectatorCount?: number }) => void)
    | null;
  leftListener:
    | ((payload: { roomId: string; playerCount: number; spectatorCount?: number }) => void)
    | null;
  connect: () => Socket;
  disconnect: () => void;
  requestRoomAvailability: (
    payload: RoomAvailabilityRequestDTO,
  ) => Promise<RoomAvailabilityResponseDTO>;
  joinRoom: (payload: JoinRoomRequest) => Promise<JoinRoomResponse>;
  leaveRoom: (roomId: string) => void;
  subscribeRoomAvailability: (roomId: string) => void;
  unsubscribeRoomAvailability: () => void;
  resumeSession: (options?: { roomId?: string; roleHint?: string }) => Promise<void>;
  subscribeRoomList: () => void;
  unsubscribeRoomList: () => void;
  requestRoomList: () => void;
}

export const useBattleSocketStore = create<BattleSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  roomAvailability: null,
  spectatorCount: 0,
  rooms: [],
  availabilityListener: null,
  roomListListener: null,
  joinedListener: null,
  leftListener: null,
  // 단일 소켓 인스턴스를 유지하고 기본 연결 상태를 관리합니다.
  connect: () => {
    const existing = get().socket;
    if (existing?.connected) {
      return existing;
    }

    if (existing) {
      existing.connect();
      return existing;
    }

    const newSocket = connectBattleSocket();

    newSocket.on(SOCKET_EVENT.CONNECT, () => set({ isConnected: true }));
    newSocket.on(SOCKET_EVENT.DISCONNECT, () => set({ isConnected: false }));

    set({ socket: newSocket, isConnected: newSocket.connected });
    return newSocket;
  },
  // 소켓과 방 상태를 정리합니다.
  disconnect: () => {
    get().unsubscribeRoomAvailability();
    disconnectBattleSocket();
    set({ isConnected: false, socket: null, roomAvailability: null });
  },
  // 방 상태를 한번 요청하고 응답으로 저장합니다.
  requestRoomAvailability: (payload: RoomAvailabilityRequestDTO) =>
    new Promise((resolve, reject) => {
      const isAvailabilityResponse = (
        response: unknown,
      ): response is RoomAvailabilityResponseDTO => {
        if (!response || typeof response !== 'object') return false;
        return 'roomId' in response && 'playerCount' in response && 'isAvailable' in response;
      };

      const socket = get().connect();
      socket.emit(
        SOCKET_EVENT.CHECK_ROOM_AVAILABILITY,
        payload,
        (response: RoomAvailabilityResponseDTO | { error?: string } | null | undefined) => {
          if (!response || 'error' in response || !isAvailabilityResponse(response)) {
            reject(new Error(response?.error ?? 'ROOM_AVAILABILITY_FAILED'));
            return;
          }
          set({ roomAvailability: response });
          resolve(response);
        },
      );
    }),
  // 방 입장 요청을 보낸다.
  joinRoom: (payload: JoinRoomRequest) =>
    new Promise((resolve, reject) => {
      const socket = get().connect();
      const profile = useUserStore.getState().user;
      const payloadWithUser: JoinRoomRequest = {
        ...payload,
        userId: payload.userId ?? profile?.id,
        username: payload.username ?? profile?.username,
        avatarUrl: payload.avatarUrl ?? profile?.avatarUrl,
      };
      let settled = false;
      const targetRoomId = payloadWithUser.roomId;
      const { setMe } = useRoomStore.getState();
      const cleanup = () => {
        settled = true;
        socket.off(SOCKET_EVENT.ROOM_STATE_ROLE, handleSync);
        socket.off(SOCKET_EVENT.ROOM_PLAYERS, handlePlayers);
        socket.off(SOCKET_EVENT.ERROR, handleError);
      };

      const handlePlayers = (payload: RoomPlayerPayload) => {
        if (payload.roomId !== targetRoomId) return;
        const { setPlayers } = useRoomStore.getState();
        setPlayers(
          payload.players.map((p) => ({
            roomId: p.roomId,
            role: p.role,
            userId: p.userId,
            username: p.username,
            avatarUrl: p.avatarUrl,
            stats: p.stats,
          })),
        );
      };

      const handleSync = (response: RoomStateSyncPayload) => {
        if (settled) return;
        if (response.roomId === targetRoomId) {
          const safeSocketId = socket.id ?? '';
          setMe({
            roomId: response.roomId,
            role: response.role,
            userId: response.userId ?? socket.id ?? '',
            username: response.username ?? `User-${safeSocketId.slice(-4)}`,
            avatarUrl: response.avatarUrl,
          });
          saveSession({
            roomId: response.roomId,
            role: response.role,
            userId: response.userId ?? socket.id ?? '',
            username: response.username ?? `User-${safeSocketId.slice(-4)}`,
            avatarUrl: response.avatarUrl,
          });
        }
        cleanup();
        resolve({ roomId: response.roomId, role: response.role });
      };

      const handleError = (error: { code?: string; message?: string }) => {
        if (settled) return;
        cleanup();
        if (error?.code === SOCKET_ERROR.ROOM_NOT_FOUND) {
          clearSession();
        }
        const err = new Error(error?.message ?? 'JOIN_ROOM_FAILED');
        if (error?.code) {
          (err as Error & { code?: string }).code = error.code;
        }
        reject(err);
      };

      socket.on(SOCKET_EVENT.ROOM_STATE_ROLE, handleSync);
      socket.on(SOCKET_EVENT.ROOM_PLAYERS, handlePlayers);
      socket.on(SOCKET_EVENT.ERROR, handleError);

      socket.emit(
        SOCKET_EVENT.JOIN_ROOM,
        payloadWithUser,
        (response: JoinRoomResponse | undefined) => {
          if (settled) return;
          if (response) {
            cleanup();
            resolve(response);
          }
        },
      );
    }),
  // 방 나가기 요청을 보낸다.
  leaveRoom: (roomId: string) => {
    const socket = get().socket;
    if (!socket) return;

    socket.emit(SOCKET_EVENT.LEAVE_ROOM, { roomId });
  },
  subscribeRoomAvailability: (roomId: string) => {
    const socket = get().connect();

    const handleAvailability = (payload: RoomAvailabilityResponseDTO) => {
      if (payload.roomId !== roomId) return;
      set({
        roomAvailability: payload,
        spectatorCount: payload.spectatorCount ?? get().spectatorCount,
      });
    };

    const handleJoined = (payload: {
      roomId: string;
      playerCount: number;
      spectatorCount?: number;
    }) => {
      if (payload.roomId !== roomId) return;
      set((state) => ({
        roomAvailability: state.roomAvailability
          ? {
              ...state.roomAvailability,
              playerCount: payload.playerCount,
            }
          : state.roomAvailability,
        spectatorCount: payload.spectatorCount ?? state.spectatorCount,
      }));
    };

    const handleLeft = (payload: {
      roomId: string;
      playerCount: number;
      spectatorCount?: number;
    }) => {
      if (payload.roomId !== roomId) return;
      set((state) => ({
        roomAvailability: state.roomAvailability
          ? {
              ...state.roomAvailability,
              playerCount: payload.playerCount,
            }
          : state.roomAvailability,
        spectatorCount: payload.spectatorCount ?? state.spectatorCount,
      }));
    };

    socket.off(SOCKET_EVENT.ROOM_AVAILABILITY);
    socket.off(SOCKET_EVENT.ROOM_USER_JOINED);
    socket.off(SOCKET_EVENT.ROOM_USER_LEFT);

    socket.on(SOCKET_EVENT.ROOM_AVAILABILITY, handleAvailability);
    socket.on(SOCKET_EVENT.ROOM_USER_JOINED, handleJoined);
    socket.on(SOCKET_EVENT.ROOM_USER_LEFT, handleLeft);

    set({
      availabilityListener: handleAvailability,
      joinedListener: handleJoined,
      leftListener: handleLeft,
    });
  },
  unsubscribeRoomAvailability: () => {
    const socket = get().socket;
    if (!socket) return;

    const { availabilityListener, joinedListener, leftListener } = get();

    if (availabilityListener) {
      socket.off(SOCKET_EVENT.ROOM_AVAILABILITY, availabilityListener);
    }
    if (joinedListener) {
      socket.off(SOCKET_EVENT.ROOM_USER_JOINED, joinedListener);
    }
    if (leftListener) {
      socket.off(SOCKET_EVENT.ROOM_USER_LEFT, leftListener);
    }

    set({ availabilityListener: null, joinedListener: null, leftListener: null });
  },
  // 저장된 세션(roomId/role)으로 자동 재입장 (간단 버전)
  resumeSession: async (options?: { roomId?: string; roleHint?: string }) => {
    const session = loadSession();
    if (!session) return;
    if (options?.roomId && options.roomId !== session.roomId) return;

    const profile = useUserStore.getState().user;
    const requestedRole =
      (session.role as 'player' | 'spectator') ??
      (options?.roleHint as 'player' | 'spectator') ??
      'spectator';
    await get().joinRoom({
      roomId: session.roomId,
      requestedRole,
      userId: profile?.id ?? session.userId,
      username: profile?.username ?? session.username,
      avatarUrl: profile?.avatarUrl ?? session.avatarUrl,
    });
  },
  subscribeRoomList: () => {
    const socket = get().connect();
    const handleRoomList = (rooms: Room[]) => set({ rooms });

    // 기존 리스너 제거 후 등록
    const { roomListListener } = get();
    if (roomListListener) {
      socket.off(SOCKET_EVENT.ROOM_LIST, roomListListener);
    }
    socket.on(SOCKET_EVENT.ROOM_LIST, handleRoomList);
    set({ roomListListener: handleRoomList });
  },
  unsubscribeRoomList: () => {
    const socket = get().socket;
    const { roomListListener } = get();
    if (!socket || !roomListListener) return;
    socket.off(SOCKET_EVENT.ROOM_LIST, roomListListener);
    set({ roomListListener: null });
  },
  requestRoomList: () => {
    const socket = get().connect();
    socket.emit(SOCKET_EVENT.ROOM_LIST_REQUEST);
  },
}));
