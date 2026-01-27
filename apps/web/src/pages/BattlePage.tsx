import { BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import BattleHeader from '@/components/Battle/BattleHeader';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import { useTheme } from '@/hooks/useTheme';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUserStore } from '@/stores/userStore';

function BattlePage() {
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const isSpectator = searchParams.get('mode') === 'spectator';
  const { theme, toggleTheme } = useTheme();
  const resumeSession = useBattleSocketStore((state) => state.resumeSession);
  const connect = useBattleSocketStore((state) => state.connect);
  const joinRoom = useBattleSocketStore((state) => state.joinRoom);
  const subscribeRoomAvailability = useBattleSocketStore(
    (state) => state.subscribeRoomAvailability,
  );
  const unsubscribeRoomAvailability = useBattleSocketStore(
    (state) => state.unsubscribeRoomAvailability,
  );
  const setProblem = useBattleProblemStore((state) => state.setProblem);
  const setTimeOffset = useBattleProblemStore((state) => state.setTimeOffset);
  const user = useUserStore((state) => state.user);
  const me = useRoomStore((state) => state.me);
  const resetProgresses = useBattleProgressStore((state) => state.resetProgresses);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';

  // 페이지 나갈 때 배틀 상태 초기화
  useEffect(() => {
    return () => {
      useRoomStore.getState().clearRoom();
      useBattleProblemStore.getState().clearProblem();
      useBattleProgressStore.getState().resetProgresses();
    };
  }, []);

  useEffect(() => {
    const socket = connect();
    const handleProblemInfo = (payload: ProblemDataPayload) => {
      if (payload?.id) {
        setProblem(payload);

        if (payload.serverTime) {
          const serverTime = new Date(payload.serverTime).getTime();
          const clientTime = Date.now();
          const offset = serverTime - clientTime;
          setTimeOffset(offset);
        }
      }
    };

    socket.on(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);

    return () => {
      socket.off(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
    };
  }, [connect, setProblem, setTimeOffset]);

  // 배틀 종료 이벤트 리스너 분리
  useEffect(() => {
    const socket = connect();
    const handleBattleEnded = (data: { battleId: string }) => {
      // 현재 배틀의 ID가 아닌 경우 무시 (다른 방의 종료 이벤트가 전역으로 퍼지는 문제 대비)
      const currentBattleId = useBattleProblemStore.getState().problem?.battleId;
      if (currentBattleId && data.battleId !== currentBattleId) {
        console.warn(
          `[BattlePage] Received BATTLE_ENDED for a different battle: ${data.battleId}. Current: ${currentBattleId}`,
        );
        return;
      }

      // 배틀 종료 시 세션 스토리지 정리
      try {
        sessionStorage.removeItem('battle-session');
        sessionStorage.removeItem('battle-progress');
      } catch {
        // ignore cleanup failures
      }
      resetProgresses();

      if (data.battleId) {
        navigate(`/result/${data.battleId}`);
      } else {
        console.error('[BattlePage] battleId missing in BATTLE_ENDED payload');
      }
    };

    socket.on(BATTLE_EVENTS.BATTLE_ENDED, handleBattleEnded);

    return () => {
      socket.off(BATTLE_EVENTS.BATTLE_ENDED, handleBattleEnded);
    };
  }, [connect, navigate, resetProgresses, roomId]);

  useEffect(() => {
    const desiredRole = isSpectator ? 'spectator' : 'player';
    if (me && me.roomId === roomId && me.role === desiredRole) return;
    const attempt = async () => {
      await resumeSession({ roomId, roleHint: desiredRole }).catch(() => {});
      if (!useRoomStore.getState().me) {
        await joinRoom({
          roomId,
          requestedRole: desiredRole,
          userId: user?.id,
          username: user?.username,
          avatarUrl: user?.avatarUrl,
        }).catch(() => {});
      }
    };
    attempt();
  }, [me, resumeSession, joinRoom, roomId, isSpectator, user?.avatarUrl, user?.id, user?.username]);

  // 관전자 수 및 인원 변동을 수신하기 위한 구독
  useEffect(() => {
    if (!roomId) return;

    subscribeRoomAvailability(roomId);
    return () => {
      unsubscribeRoomAvailability();
    };
  }, [roomId, subscribeRoomAvailability, unsubscribeRoomAvailability]);

  useEffect(() => {
    const socket = connect();
    const handleReconnect = () => {
      // 소켓 재연결 시 저장된 세션 기준으로 다시 JOIN_ROOM 시도
      const desiredRole = isSpectator ? 'spectator' : 'player';
      resumeSession({ roleHint: desiredRole })
        .catch(() => {})
        .then(() => {
          if (!useRoomStore.getState().me) {
            joinRoom({
              roomId,
              requestedRole: desiredRole,
              userId: user?.id,
              username: user?.username,
              avatarUrl: user?.avatarUrl,
            }).catch(() => {});
          }
        });
    };
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [
    connect,
    resumeSession,
    joinRoom,
    roomId,
    isSpectator,
    user?.avatarUrl,
    user?.id,
    user?.username,
  ]);

  return (
    <div className="min-h-svh overflow-auto xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-svh flex-col gap-3 px-3 py-3 xl:h-full xl:w-full xl:gap-4 xl:px-6 xl:py-4">
        <BattleHeader theme={theme} onToggleTheme={toggleTheme} showLeaveConfirm={!isSpectator} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectator ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
    </div>
  );
}

export default BattlePage;
