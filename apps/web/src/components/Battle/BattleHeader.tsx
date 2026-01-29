import { BATTLE_EVENTS } from '@shared/constants/battle';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, Moon, Sun, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import logo from '@/assets/logo.png';
import Modal from '@/components/Common/Modal';
import { playCountdownSound } from '@/lib/sound';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

interface BattleHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  showLeaveConfirm?: boolean;
}

function BattleHeader({ theme, onToggleTheme, showLeaveConfirm = true }: BattleHeaderProps) {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const leaveRoom = useBattleSocketStore((state) => state.leaveRoom);
  const leaveBattle = useBattleSocketStore((state) => state.leaveBattle);
  const spectatorCount = useBattleSocketStore((state) => state.spectatorCount);
  const problem = useBattleProblemStore((state) => state.problem);
  const timeOffset = useBattleProblemStore((state) => state.timeOffset);
  const me = useRoomStore((state) => state.me);

  const battleId = problem?.battleId;
  const duration = problem?.duration;
  const startedAt = problem?.startedAt;

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [hasEmittedEnd, setHasEmittedEnd] = useState(false);
  const hasPlayedCountdownRef = useRef(false);

  useEffect(() => {
    if (!startedAt || !duration) return;

    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + duration * 1000;

    const updateTimer = () => {
      // 서버 시간 추정: 클라이언트 시간 + 오프셋
      const now = Date.now() + timeOffset;
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      // 5초 시점에 효과음 시작 (한 번만)
      if (remaining === 5 && !hasPlayedCountdownRef.current) {
        hasPlayedCountdownRef.current = true;
        playCountdownSound('tick');
      }

      if (remaining <= 0 && !hasEmittedEnd) {
        // 타이머 종료 처리
        const socket = useBattleSocketStore.getState().socket;
        if (socket && battleId) {
          socket.emit(BATTLE_EVENTS.TIMER_END, { battleId, roomId });
          setHasEmittedEnd(true);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, duration, timeOffset, hasEmittedEnd, battleId, roomId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveClick = () => {
    if (showLeaveConfirm) {
      setIsLeaveModalOpen(true);
    } else {
      handleConfirmLeave();
    }
  };

  const handleConfirmLeave = () => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // 플레이어가 배틀 중이면 배틀 포기
    if (showLeaveConfirm && battleId && me?.userId) {
      // BATTLE_ENDED 이벤트에서 정리 및 페이지 이동 처리
      leaveBattle(roomId, battleId, me.userId);
    } else {
      leaveRoom(roomId);
      navigate('/');
    }
    try {
      sessionStorage.removeItem('battle-session');
      sessionStorage.removeItem('battle-progress');
    } catch {
      // ignore
    }
    navigate('/');
  };

  const handleCancelLeave = () => {
    setIsLeaveModalOpen(false);
  };

  return (
    <header className="flex w-full items-center justify-between rounded-2xl px-5 text-base-primary backdrop-blur dark:shadow-slate-950/40">
      <div className="flex items-center gap-3">
        <img src={logo} alt="TADAK 로고" className="h-12 w-auto" />
        <span className="text-2xl font-black tracking-tight">TADAK</span>
      </div>

      <div className="flex items-center gap-3">
        <motion.div
          animate={
            timeLeft <= 5 && timeLeft > 0
              ? {
                  scale: [1, 1.05, 1],
                  transition: { repeat: Infinity, duration: 0.8 },
                }
              : { scale: 1 }
          }
          className={`flex items-center gap-2 rounded-3xl px-4 py-1 text-lg font-bold shadow-[1px_1px_4px_rgba(0,0,0,0.05)] transition-colors duration-300 ${
            timeLeft <= 5 && timeLeft > 0
              ? 'bg-red-50 text-error-01 dark:bg-error-01/10'
              : 'bg-green-01 text-green-06'
          }`}
        >
          <Timer className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-bold leading-7">{formatTime(timeLeft)}</span>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-base-faint px-5 py-2 text-sm font-medium text-base-primary">
          <Eye className="h-4 w-4 text-base-secondary" strokeWidth={2.5} />
          <span className="text-base-primary">{spectatorCount}</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-base-faint text-base-primary transition hover:brightness-110"
          aria-label="테마 전환"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          onClick={handleLeaveClick}
          className="inline-flex h-10 w-20 items-center justify-center rounded-full bg-base-faint text-sm font-bold text-base-primary transition hover:brightness-110"
        >
          나가기
        </button>
      </div>

      {showLeaveConfirm && (
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
      )}
    </header>
  );
}

export default BattleHeader;
