import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { MatchingSuccessResponse } from '@shared/types/matching';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';

import * as matchingApi from '@/apis/matching';

interface MatchingStats {
  waitingPlayers: number;
  ongoingBattles: number;
  avgMatchTime: number;
}

interface MatchingStore {
  matchResult: MatchingSuccessResponse | null;
  stats: MatchingStats | null;
  timeoutMessage: string | null;

  registerMatchingListeners: (socket: Socket) => void;
  unregisterMatchingListeners: (socket: Socket) => void;
  startMatching: (userId: string, socketId: string) => Promise<void>;
  cancelMatching: (userId: string) => Promise<void>;
  cleanup: () => void;
}

export const useMatchingStore = create<MatchingStore>((set, get) => ({
  matchResult: null,
  stats: null,
  timeoutMessage: null,

  // MATCH_SUCCESS, STATS_UPDATE, MATCHING_TIMEOUT, OPPONENT_DISCONNECTED 이벤트 리스너 등록
  registerMatchingListeners: (socket: Socket) => {
    const handleMatchSuccess = (data: MatchingSuccessResponse) => {
      set({ matchResult: data });
    };

    const handleStatsUpdate = (data: MatchingStats) => {
      set({ stats: data });
    };

    const handleMatchingTimeout = (data: { message: string }) => {
      set({ timeoutMessage: data.message });
    };

    const handleOpponentDisconnected = (data: { message: string }) => {
      // TODO: 토스트 메시지 표시
      alert(data.message);

      // 상태 초기화
      get().cleanup();
    };

    // 기존 리스너 제거 후 새로 등록
    socket.off(SOCKET_EVENT.MATCH_SUCCESS);
    socket.off(SOCKET_EVENT.STATS_UPDATE);
    socket.off(SOCKET_EVENT.MATCHING_TIMEOUT);
    socket.off(SOCKET_EVENT.OPPONENT_DISCONNECTED);
    socket.on(SOCKET_EVENT.MATCH_SUCCESS, handleMatchSuccess);
    socket.on(SOCKET_EVENT.STATS_UPDATE, handleStatsUpdate);
    socket.on(SOCKET_EVENT.MATCHING_TIMEOUT, handleMatchingTimeout);
    socket.on(SOCKET_EVENT.OPPONENT_DISCONNECTED, handleOpponentDisconnected);
  },

  // 매칭 관련 소켓 리스너 제거
  unregisterMatchingListeners: (socket: Socket) => {
    socket.off(SOCKET_EVENT.MATCH_SUCCESS);
    socket.off(SOCKET_EVENT.STATS_UPDATE);
    socket.off(SOCKET_EVENT.MATCHING_TIMEOUT);
    socket.off(SOCKET_EVENT.OPPONENT_DISCONNECTED);
  },

  // 매칭 시작
  startMatching: async (userId: string, socketId: string) => {
    try {
      if (!socketId) {
        throw new Error('Socket ID가 없습니다.');
      }

      await matchingApi.startMatching({
        userId,
        socketId,
      });
    } catch (error) {
      console.error('매칭 시작 실패:', error);
      throw error;
    }
  },

  // 매칭 취소
  cancelMatching: async (userId: string) => {
    try {
      await matchingApi.cancelMatching({ userId });
      get().cleanup();
    } catch (error) {
      console.error('매칭 취소 실패:', error);
      throw error;
    }
  },

  // 정리
  cleanup: () => {
    set({ matchResult: null, stats: null, timeoutMessage: null });
  },
}));
