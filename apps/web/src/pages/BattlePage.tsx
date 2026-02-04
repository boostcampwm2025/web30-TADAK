import { BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ChatMessage } from '@shared/types/chat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import BattleFinishOverlay from '@/components/Battle/BattleFinishOverlay';
import BattleHeader from '@/components/Battle/BattleHeader';
import LeaveBattleModal from '@/components/Battle/modals/LeaveBattleModal';
import RoleModal from '@/components/Battle/modals/RoleModal';
import BattleSystemToast from '@/components/Battle/overlays/BattleSystemToast';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import { useBattleJoin } from '@/hooks/useBattleJoin';
import { useRoleModalState } from '@/hooks/useRoleModalState';
import { useTheme } from '@/hooks/useTheme';
import { playCountdownSound } from '@/lib/sound';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleProgressStore } from '@/stores/battleProgressStore';
import type { BattleSocketState } from '@/stores/battleSocketStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useBattleToastStore } from '@/stores/battleToastStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUserStore } from '@/stores/userStore';

function BattlePage() {
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const isSpectator = searchParams.get('mode') === 'spectator';
  const desiredRole = isSpectator ? 'spectator' : 'player';
  const { theme, toggleTheme } = useTheme();
  const {
    resumeSession,
    connect,
    joinRoom,
    leaveRoom,
    leaveBattle,
    subscribeRoomAvailability,
    unsubscribeRoomAvailability,
    requestRoomAvailability,
    isLeavingBattle,
  } = useBattleSocketStore(
    useShallow((state: BattleSocketState) => ({
      resumeSession: state.resumeSession,
      connect: state.connect,
      joinRoom: state.joinRoom,
      leaveRoom: state.leaveRoom,
      leaveBattle: state.leaveBattle,
      subscribeRoomAvailability: state.subscribeRoomAvailability,
      unsubscribeRoomAvailability: state.unsubscribeRoomAvailability,
      requestRoomAvailability: state.requestRoomAvailability,
      isLeavingBattle: state.isLeavingBattle,
    })),
  );
  const { problem, clearProblem } = useBattleProblemStore(
    useShallow((state) => ({
      problem: state.problem,
      clearProblem: state.clearProblem,
    })),
  );
  const { me, clearRoom } = useRoomStore(
    useShallow((state) => ({
      me: state.me,
      clearRoom: state.clearRoom,
    })),
  );
  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user,
    })),
  );
  const { resetProgresses } = useBattleProgressStore(
    useShallow((state) => ({
      resetProgresses: state.resetProgresses,
    })),
  );
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalReason, setRoleModalReason] = useState<
    'player-to-spectator' | 'spectator-to-player' | 'not-authorized-player' | null
  >(null);
  const showSystemToast = useBattleToastStore((state) => state.show);
  const lastCheatSentAtRef = useRef(0);

  const [showFinishOverlay, setShowFinishOverlay] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';
  const socket = connect();
  const battleId = problem?.battleId;
  const effectiveRole = useMemo(
    () => (me && me.roomId === roomId ? me.role : (desiredRole as 'player' | 'spectator')),
    [me, roomId, desiredRole],
  );
  const isSpectatorView = useMemo(() => effectiveRole === 'spectator', [effectiveRole]);
  const isCheatDetectionEnabled = import.meta.env.VITE_CHEAT_DETECTION_ENABLED !== 'false';
  const { isRoleMismatch, modalReason, shouldShowRoleModal } = useRoleModalState({
    me,
    roomId,
    desiredRole,
    roleModalReason,
    isRoleModalOpen,
  });

  const handleInvalidRole = useCallback(() => {
    setRoleModalReason('not-authorized-player');
    setIsRoleModalOpen(true);
  }, []);

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
  const handleLeaveClick = useCallback(() => {
    if (isSpectator) {
      if (roomId) {
        leaveRoom(roomId);
      }
      navigate('/');
    } else {
      setShowLeaveModal(true);
    }
  }, [isSpectator, leaveRoom, navigate, roomId]);

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
      useUserStore.getState().setIsLeavingRoom(true);
      leaveBattle(roomId, battleId, me.userId);
      useUserStore.getState().clearCurrentRoomId();
      if (blocker.state === 'blocked') blocker.proceed?.();
    } else {
      useUserStore.getState().setIsLeavingRoom(true);
      leaveRoom(roomId);
      if (blocker.state === 'blocked') blocker.proceed?.();
      else navigate('/');
    }

    try {
      sessionStorage.removeItem('battle-session');
      sessionStorage.removeItem('battle-progress');
    } catch {
      // ignore
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
      if (isLeaving) {
        useUserStore.getState().setIsLeavingRoom(true);
      }
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
  }, [navigate, resetProgresses, clearProblem, clearRoom, roomId, socket]);

  useEffect(() => {
    subscribeRoomAvailability(roomId);
    requestRoomAvailability({ roomId }).catch(() => {});
    return () => {
      unsubscribeRoomAvailability();
    };
  }, [requestRoomAvailability, roomId, subscribeRoomAvailability, unsubscribeRoomAvailability]);

  useEffect(() => {
    if (!isCheatDetectionEnabled) return;
    if (effectiveRole !== 'player') return;
    if (!roomId) return;

    const emitCheatWarning = (type: 'FOCUS_OUT' | 'PASTE') => {
      if (!socket?.connected) return;
      const now = Date.now();
      if (now - lastCheatSentAtRef.current < 1000) return;
      lastCheatSentAtRef.current = now;
      socket.emit(SOCKET_EVENT.CHEAT_WARNING, { roomId, type });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        emitCheatWarning('FOCUS_OUT');
      }
    };

    const handleBlur = () => {
      emitCheatWarning('FOCUS_OUT');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [effectiveRole, roomId, isCheatDetectionEnabled, socket]);

  useEffect(() => {
    const handleSystemMessage = (message: ChatMessage) => {
      if (effectiveRole !== 'player') return;
      if (message.type !== 'SYSTEM') return;
      if (!message.message.includes('부정행위 경고') && !message.message.includes('패배 처리')) {
        return;
      }
      showSystemToast(message.message);
    };

    socket.on(SOCKET_EVENT.RECEIVE_CHAT, handleSystemMessage);
    return () => {
      socket.off(SOCKET_EVENT.RECEIVE_CHAT, handleSystemMessage);
    };
  }, [effectiveRole, socket, showSystemToast]);

  useBattleJoin({
    roomId,
    desiredRole,
    isRoleModalOpen,
    isRoleMismatch,
    user,
    socket,
    resumeSession,
    joinRoom,
    onInvalidRole: handleInvalidRole,
  });

  const handleRoleDenied = () => {
    setIsRoleModalOpen(false);
    setRoleModalReason(null);

    if (modalReason === 'player-to-spectator') {
      navigate(`/room/${roomId}`, { replace: true });
      return;
    }

    if (modalReason === 'spectator-to-player') {
      navigate(`/room/${roomId}?mode=spectator`, { replace: true });
      return;
    }

    if (me?.roomId === roomId) {
      leaveRoom(roomId);
    }
    try {
      sessionStorage.removeItem('battle-session');
    } catch {
      // ignore
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-svh overflow-auto xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-svh flex-col gap-3 px-3 py-3 xl:h-full xl:w-full xl:gap-4 xl:px-6 xl:py-4">
        <BattleHeader theme={theme} toggleTheme={toggleTheme} onLeaveClick={handleLeaveClick} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectatorView ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
      <RoleModal isOpen={shouldShowRoleModal} reason={modalReason} onConfirm={handleRoleDenied} />
      <BattleFinishOverlay isVisible={showFinishOverlay} />

      <LeaveBattleModal
        isOpen={isLeaveModalOpen}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
      <BattleSystemToast />
    </div>
  );
}

export default BattlePage;
