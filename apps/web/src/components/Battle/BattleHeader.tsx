import { BATTLE_EVENTS } from '@shared/constants/battle';
import { motion } from 'framer-motion';
import { Eye, Moon, Settings, Sun, Timer, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import logo from '@/assets/logo.png';
import { playCountdownSound } from '@/lib/sound';
import { playPreviewSound } from '@/lib/sound';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useSoundStore } from '@/stores/soundStore';

interface BattleHeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLeaveClick: () => void;
}

function BattleHeader({ theme, toggleTheme, onLeaveClick }: BattleHeaderProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const spectatorCount = useBattleSocketStore((state) => state.spectatorCount);
  const problem = useBattleProblemStore((state) => state.problem);
  const timeOffset = useBattleProblemStore((state) => state.timeOffset);

  const { volume, isMuted, setVolume, toggleMute } = useSoundStore();
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const settingRef = useRef<HTMLDivElement>(null);

  const battleId = problem?.battleId;
  const duration = problem?.duration;
  const startedAt = problem?.startedAt;

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
    <header className="relative z-50 flex w-full items-center justify-between rounded-2xl px-5 text-base-primary backdrop-blur dark:shadow-slate-950/40">
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
          onClick={onLeaveClick}
          className="inline-flex h-10 w-20 items-center justify-center rounded-full bg-base-faint text-sm font-bold text-base-primary transition hover:brightness-110"
        >
          나가기
        </button>
        <div className="relative" ref={settingRef}>
          <button
            onClick={() => setIsSettingOpen(!isSettingOpen)}
            className="rounded-full bg-base-faint p-2 text-ink shadow-sm transition hover:scale-110 active:scale-95"
          >
            <Settings size={24} className="text-slate-400" />
          </button>
          {isSettingOpen && (
            <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-24 bg-bg-layer-2 p-2 shadow-2xl focus:outline-none transition-all duration-200 ease-out z-[100]">
              <div className="flex flex-col gap-1">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-ink transition hover:bg-base-muted"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={18} />
                      <span>라이트 모드</span>
                    </>
                  ) : (
                    <>
                      <Moon size={18} />
                      <span>다크 모드</span>
                    </>
                  )}
                </button>
                <div className="my-1 h-[1px] bg-border-soft" />
                <div className="flex items-center gap-3 px-4 py-2">
                  <button
                    onClick={toggleMute}
                    className="text-ink transition hover:text-brand"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    onMouseUp={playPreviewSound}
                    onTouchEnd={playPreviewSound}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-soft accent-brand"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default BattleHeader;
