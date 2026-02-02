import { BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_ERROR, SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ChatMessage } from '@shared/types/chat';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import BattleFinishOverlay from '@/components/Battle/BattleFinishOverlay';
import BattleHeader from '@/components/Battle/BattleHeader';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import Modal from '@/components/Common/Modal';
import Toast from '@/components/Common/Toast';
import { useTheme } from '@/hooks/useTheme';
import { playCountdownSound } from '@/lib/sound';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleProgressStore } from '@/stores/battleProgressStore';
import type { BattleSocketState } from '@/stores/battleSocketStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
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
  const [systemToastMessage, setSystemToastMessage] = useState<string | null>(null);
  const lastCheatSentAtRef = useRef(0);

  const [showFinishOverlay, setShowFinishOverlay] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const userRef = useRef(user);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';
  const battleId = problem?.battleId;
  const effectiveRole =
    me && me.roomId === roomId ? me.role : (desiredRole as 'player' | 'spectator');
  const isSpectatorView = effectiveRole === 'spectator';
  const isCheatDetectionEnabled = import.meta.env.VITE_CHEAT_DETECTION_ENABLED !== 'false';
  const isRoleMismatch = Boolean(me && me.roomId === roomId && me.role !== desiredRole);
  const mismatchReason = isRoleMismatch
    ? me?.role === 'player'
      ? 'player-to-spectator'
      : 'spectator-to-player'
    : null;
  const modalReason = roleModalReason ?? mismatchReason;
  const shouldShowRoleModal = isRoleModalOpen || isRoleMismatch;

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
  }, [connect, navigate, resetProgresses, clearProblem, clearRoom, roomId]);

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

    const socket = connect();
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
  }, [connect, effectiveRole, roomId, isCheatDetectionEnabled]);

  useEffect(() => {
    const socket = connect();
    const handleSystemMessage = (message: ChatMessage) => {
      if (effectiveRole !== 'player') return;
      if (message.type !== 'SYSTEM') return;
      if (!message.message.includes('부정행위 경고') && !message.message.includes('패배 처리')) {
        return;
      }
      setSystemToastMessage(message.message);
    };

    socket.on(SOCKET_EVENT.RECEIVE_CHAT, handleSystemMessage);
    return () => {
      socket.off(SOCKET_EVENT.RECEIVE_CHAT, handleSystemMessage);
    };
  }, [connect, effectiveRole]);

  useEffect(() => {
    if (isRoleModalOpen || isRoleMismatch) return;
    if (useRoomStore.getState().me?.roomId === roomId) {
      return;
    }
    const attempt = async () => {
      await resumeSession({ roomId, roleHint: desiredRole }).catch(() => {});
      if (!useRoomStore.getState().me) {
        try {
          const currentUser = userRef.current;
          await joinRoom({
            roomId,
            requestedRole: desiredRole,
            userId: currentUser?.id,
            username: currentUser?.username,
            avatarUrl: currentUser?.avatarUrl,
          });
        } catch (error) {
          const code = (error as Error & { code?: string }).code;
          if (code === SOCKET_ERROR.INVALID_ROLE) {
            setRoleModalReason('not-authorized-player');
            setIsRoleModalOpen(true);
          }
        }
      }
    };
    attempt();
  }, [isRoleModalOpen, isRoleMismatch, resumeSession, joinRoom, roomId, desiredRole]);

  useEffect(() => {
    const socket = connect();
    const handleReconnect = () => {
      if (isRoleMismatch) return;
      // 소켓 재연결 시 저장된 세션 기준으로 다시 JOIN_ROOM 시도
      resumeSession({ roleHint: desiredRole })
        .catch(() => {})
        .then(() => {
          if (!useRoomStore.getState().me) {
            const currentUser = userRef.current;
            joinRoom({
              roomId,
              requestedRole: desiredRole,
              userId: currentUser?.id,
              username: currentUser?.username,
              avatarUrl: currentUser?.avatarUrl,
            }).catch((error) => {
              const code = (error as Error & { code?: string }).code;
              if (code === SOCKET_ERROR.INVALID_ROLE) {
                setRoleModalReason('not-authorized-player');
                setIsRoleModalOpen(true);
              }
            });
          }
        });
    };
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [connect, resumeSession, joinRoom, roomId, desiredRole, isRoleMismatch]);

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

  const roleModalTitle =
    modalReason === 'player-to-spectator'
      ? '참가자는 관전자로 전환할 수 없습니다'
      : modalReason === 'spectator-to-player'
        ? '관전자는 참가자로 전환할 수 없습니다'
        : '참가자 전용 방입니다';

  const roleModalDescription =
    modalReason === 'player-to-spectator' ? (
      <>
        참가자 화면으로 이동합니다.
        <br />
        URL을 변경해도 역할은 바뀌지 않습니다.
      </>
    ) : modalReason === 'spectator-to-player' ? (
      <>
        관전 화면으로 이동합니다.
        <br />
        참가자 권한이 있어야 입장할 수 있습니다.
      </>
    ) : (
      <>
        해당 방의 참가자가 아닙니다.
        <br />
        메인 페이지로 이동합니다.
      </>
    );

  return (
    <div className="min-h-svh overflow-auto xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-svh flex-col gap-3 px-3 py-3 xl:h-full xl:w-full xl:gap-4 xl:px-6 xl:py-4">
        <BattleHeader theme={theme} toggleTheme={toggleTheme} onLeaveClick={handleLeaveClick} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectatorView ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
      <Modal
        isOpen={shouldShowRoleModal}
        onClose={handleRoleDenied}
        icon={AlertCircle}
        iconColor="text-error-01"
        iconBgColor="bg-error-01/20"
        title={roleModalTitle}
        description={roleModalDescription}
        buttons={[
          {
            label: '확인',
            onClick: handleRoleDenied,
            variant: 'black',
          },
        ]}
        closeOnBackdrop={false}
      />
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
      {systemToastMessage && (
        <Toast message={systemToastMessage} onClose={() => setSystemToastMessage(null)} />
      )}
    </div>
  );
}

export default BattlePage;
