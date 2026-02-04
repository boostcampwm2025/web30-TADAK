import { BATTLE_EVENTS } from '@shared/constants/battle';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { playCountdownSound } from '@/lib/sound';
import { useBattleSocketStore } from '@/stores/battleSocketStore';

type BattleTimerProps = {
  battleId?: string;
  duration?: number;
  startedAt?: string;
  timeOffset: number;
  roomId?: string;
};

export default function BattleTimer({
  battleId,
  duration,
  startedAt,
  timeOffset,
  roomId,
}: BattleTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
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

  return (
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
  );
}
