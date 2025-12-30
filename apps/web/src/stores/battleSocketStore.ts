import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type {
  JoinRoomRequest,
  JoinRoomResponse,
  RoomAvailabilityRequestDTO,
  RoomAvailabilityResponseDTO,
  RoomPlayerPayload,
  RoomStateSyncPayload,
} from '@shared/types/room';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';

import { connectBattleSocket, disconnectBattleSocket } from '../lib/battleSocket';
import { useRoomStore } from './roomStore';

interface BattleSocketState {
  socket: Socket | null;
  isConnected: boolean;
  roomAvailability: RoomAvailabilityResponseDTO | null;
  availabilityListener: ((payload: RoomAvailabilityResponseDTO) => void) | null;
  joinedListener: ((payload: { playerCount: number }) => void) | null;
  leftListener: ((payload: { playerCount: number }) => void) | null;
  connect: () => Socket;
  disconnect: () => void;
  requestRoomAvailability: (
    payload: RoomAvailabilityRequestDTO,
  ) => Promise<RoomAvailabilityResponseDTO>;
  joinRoom: (payload: JoinRoomRequest) => Promise<JoinRoomResponse>;
  leaveRoom: (roomId: string) => void;
  subscribeRoomAvailability: (roomId: string) => void;
  unsubscribeRoomAvailability: () => void;
}

export const useBattleSocketStore = create<BattleSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  roomAvailability: null,
  availabilityListener: null,
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
      let settled = false;
      const cleanup = () => {
        settled = true;
        socket.off(SOCKET_EVENT.ROOM_STATE_ROLE, handleSync);
        socket.off(SOCKET_EVENT.ROOM_PLAYERS, handlePlayers);
        socket.off(SOCKET_EVENT.ERROR, handleError);
      };

      const handlePlayers = (payload: RoomPlayerPayload) => {
        if (payload.roomId !== payload.roomId) return;
        const { setPlayers } = useRoomStore.getState();
        setPlayers(
          payload.players.map((p) => ({
            roomId: p.roomId,
            role: p.role,
            userId: p.userId,
            username: p.username,
          })),
        );
      };

      const handleSync = (response: RoomStateSyncPayload) => {
        if (settled) return;
        cleanup();
        resolve({ roomId: response.roomId, role: response.role });
      };

      const handleError = (error: { message?: string }) => {
        if (settled) return;
        cleanup();
        reject(new Error(error?.message ?? 'JOIN_ROOM_FAILED'));
      };

      socket.on(SOCKET_EVENT.ROOM_STATE_ROLE, handleSync);
      socket.on(SOCKET_EVENT.ROOM_PLAYERS, handlePlayers);
      socket.on(SOCKET_EVENT.ERROR, handleError);

      socket.emit(SOCKET_EVENT.JOIN_ROOM, payload, (response: JoinRoomResponse | undefined) => {
        if (settled) return;
        if (response) {
          cleanup();
          resolve(response);
        }
      });
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
      set({ roomAvailability: payload });
    };

    const handleJoined = (payload: { playerCount: number }) => {
      set((state) => {
        if (!state.roomAvailability) return state;
        return {
          roomAvailability: {
            ...state.roomAvailability,
            playerCount: payload.playerCount,
          },
        };
      });
    };

    const handleLeft = (payload: { playerCount: number }) => {
      set((state) => {
        if (!state.roomAvailability) return state;
        return {
          roomAvailability: {
            ...state.roomAvailability,
            playerCount: payload.playerCount,
          },
        };
      });
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
}));
