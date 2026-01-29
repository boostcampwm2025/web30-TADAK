import { BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_ERROR, SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
  const desiredRole = isSpectator ? 'spectator' : 'player';
  const { theme, toggleTheme } = useTheme();
  const resumeSession = useBattleSocketStore((state) => state.resumeSession);
  const connect = useBattleSocketStore((state) => state.connect);
  const joinRoom = useBattleSocketStore((state) => state.joinRoom);
  const leaveRoom = useBattleSocketStore((state) => state.leaveRoom);
  const subscribeRoomAvailability = useBattleSocketStore(
    (state) => state.subscribeRoomAvailability,
  );
  const unsubscribeRoomAvailability = useBattleSocketStore(
    (state) => state.unsubscribeRoomAvailability,
  );
  const requestRoomAvailability = useBattleSocketStore((state) => state.requestRoomAvailability);
  const setProblem = useBattleProblemStore((state) => state.setProblem);
  const setTimeOffset = useBattleProblemStore((state) => state.setTimeOffset);
  const clearProblem = useBattleProblemStore((state) => state.clearProblem);
  const clearRoom = useRoomStore((state) => state.clearRoom);
  const user = useUserStore((state) => state.user);
  const me = useRoomStore((state) => state.me);
  const resetProgresses = useBattleProgressStore((state) => state.resetProgresses);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalReason, setRoleModalReason] = useState<
    'player-to-spectator' | 'spectator-to-player' | 'not-authorized-player' | null
  >(null);

  const [showFinishOverlay, setShowFinishOverlay] = useState(false);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';
  const effectiveRole =
    me && me.roomId === roomId ? me.role : (desiredRole as 'player' | 'spectator');
  const isSpectatorView = effectiveRole === 'spectator';
  const isRoleMismatch = Boolean(me && me.roomId === roomId && me.role !== desiredRole);
  const mismatchReason = isRoleMismatch
    ? me?.role === 'player'
      ? 'player-to-spectator'
      : 'spectator-to-player'
    : null;
  const modalReason = roleModalReason ?? mismatchReason;
  const shouldShowRoleModal = isRoleModalOpen || isRoleMismatch;

  // 페이지 나갈 때 배틀 상태 초기화
  useEffect(() => {
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
    if (isRoleModalOpen || isRoleMismatch) return;
    if (me && me.roomId === roomId) {
      return;
    }
    const attempt = async () => {
      await resumeSession({ roomId, roleHint: desiredRole }).catch(() => {});
      if (!useRoomStore.getState().me) {
        try {
          await joinRoom({
            roomId,
            requestedRole: desiredRole,
            userId: user?.id,
            username: user?.username,
            avatarUrl: user?.avatarUrl,
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
  }, [
    isRoleModalOpen,
    isRoleMismatch,
    me,
    resumeSession,
    joinRoom,
    roomId,
    desiredRole,
    user?.avatarUrl,
    user?.id,
    user?.username,
  ]);

  useEffect(() => {
    const socket = connect();
    const handleReconnect = () => {
      if (isRoleMismatch) return;
      // 소켓 재연결 시 저장된 세션 기준으로 다시 JOIN_ROOM 시도
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
  }, [
    connect,
    resumeSession,
    joinRoom,
    roomId,
    desiredRole,
    isRoleMismatch,
    user?.avatarUrl,
    user?.id,
    user?.username,
  ]);

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
        <BattleHeader
          theme={theme}
          onToggleTheme={toggleTheme}
          showLeaveConfirm={!isSpectatorView}
        />
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
    </div>
  );
}

export default BattlePage;
