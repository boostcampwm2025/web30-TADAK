import { BATTLE_EVENTS } from '@shared/constants/battle';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import BattleFinishOverlay from '@/components/Battle/BattleFinishOverlay';
import BattleHeader from '@/components/Battle/BattleHeader';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import Modal from '@/components/Common/Modal';
import { useTheme } from '@/hooks/useTheme';
import { playCountdownSound } from '@/lib/sound';
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
  const leaveRoom = useBattleSocketStore((state) => state.leaveRoom);
  const leaveBattle = useBattleSocketStore((state) => state.leaveBattle);
  const subscribeRoomAvailability = useBattleSocketStore(
    (state) => state.subscribeRoomAvailability,
  );
  const unsubscribeRoomAvailability = useBattleSocketStore(
    (state) => state.unsubscribeRoomAvailability,
  );
  const clearProblem = useBattleProblemStore((state) => state.clearProblem);
  const clearRoom = useRoomStore((state) => state.clearRoom);
  const problem = useBattleProblemStore((state) => state.problem);
  const user = useUserStore((state) => state.user);
  const me = useRoomStore((state) => state.me);
  const resetProgresses = useBattleProgressStore((state) => state.resetProgresses);

  const [showFinishOverlay, setShowFinishOverlay] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';
  const battleId = problem?.battleId;
  const isLeavingBattle = useBattleSocketStore((state) => state.isLeavingBattle);

  // 뒤로가기 차단 (플레이어 + 배틀 중 + 나가기 미확인 시)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isSpectator &&
      !!battleId &&
      !isLeavingBattle &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  const isLeaveModalOpen = blocker.state === 'blocked' || showLeaveModal;

  // 나가기 버튼 클릭 핸들러
  const handleLeaveClick = () => {
    if (isSpectator) {
      if (roomId) {
        leaveRoom(roomId);
      }
      navigate('/');
    } else {
      setShowLeaveModal(true);
    }
  };

  // 모달에서 나가기 확인
  const handleConfirmLeave = () => {
    setShowLeaveModal(false);

    if (!roomId) {
      if (blocker.state === 'blocked') blocker.proceed?.();
      else navigate('/');
      return;
    }

    // 플레이어가 배틀 중이면 배틀 포기
    if (battleId && me?.userId) {
      leaveBattle(roomId, battleId, me.userId);
      useUserStore.getState().clearCurrentRoomId();
      if (blocker.state === 'blocked') blocker.proceed?.();
    } else {
      leaveRoom(roomId);
      if (blocker.state === 'blocked') blocker.proceed?.();
      else navigate('/');
    }
  };

  // 모달에서 취소
  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    if (blocker.state === 'blocked') {
      blocker.reset?.();
    }
  };

  // 페이지 진입/나갈 때 상태 초기화
  useEffect(() => {
    useBattleSocketStore.setState({ isLeavingBattle: false });

    return () => {
      useRoomStore.getState().clearRoom();
      useBattleProblemStore.getState().clearProblem();
      useBattleProgressStore.getState().resetProgresses();
    };
  }, []);

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

      // 본인이 나가기 버튼을 눌렀는지 확인
      const isLeaving = useBattleSocketStore.getState().isLeavingBattle;

      // 배틀 종료 시 모든 상태 정리
      clearProblem();
      clearRoom();
      resetProgresses();
      useUserStore.getState().clearCurrentRoomId();
      useBattleSocketStore.setState({ isLeavingBattle: false });
      try {
        sessionStorage.removeItem('battle-session');
        sessionStorage.removeItem('battle-progress');
      } catch {
        // ignore cleanup failures
      }

      // 본인이 포기한 경우 메인으로, 아니면 결과 페이지로
      if (isLeaving) {
        navigate('/');
      } else if (data.battleId) {
        setShowFinishOverlay(true);
        playCountdownSound('end');
        setTimeout(() => {
          navigate(`/result/${data.battleId}`, { replace: true });
        }, 3000);
      } else {
        console.error('[BattlePage] battleId missing in BATTLE_ENDED payload');
      }
    };

    socket.on(BATTLE_EVENTS.BATTLE_ENDED, handleBattleEnded);

    return () => {
      socket.off(BATTLE_EVENTS.BATTLE_ENDED, handleBattleEnded);
    };
  }, [connect, navigate, resetProgresses, clearProblem, clearRoom, roomId]);

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
        <BattleHeader theme={theme} onToggleTheme={toggleTheme} onLeaveClick={handleLeaveClick} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectator ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
      <BattleFinishOverlay isVisible={showFinishOverlay} />

      <Modal
        isOpen={isLeaveModalOpen}
        onClose={handleCancelLeave}
        icon={AlertCircle}
        iconColor="text-error-01"
        iconBgColor="bg-error-01/20"
        title="대결에서 나가시겠습니까?"
        description="진행 중인 문제 풀이가 모두 사라집니다."
        buttons={[
          {
            label: '취소',
            onClick: handleCancelLeave,
            variant: 'muted',
          },
          {
            label: '나가기',
            onClick: handleConfirmLeave,
            variant: 'black',
          },
        ]}
        closeOnBackdrop={false}
      />
    </div>
  );
}

export default BattlePage;
