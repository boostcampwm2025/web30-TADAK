import { memo } from 'react';
import { useParams } from 'react-router-dom';

import logo from '@/assets/logo.webp';
import BattleSettingsMenu from '@/components/Battle/BattleSettingsMenu';
import BattleTimer from '@/components/Battle/BattleTimer';
import SpectatorCountBadge from '@/components/Battle/SpectatorCountBadge';
import { useBattleProblemStore } from '@/stores/battleProblemStore';

interface BattleHeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLeaveClick: () => void;
}

function BattleHeader({ theme, toggleTheme, onLeaveClick }: BattleHeaderProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const problem = useBattleProblemStore((state) => state.problem);
  const timeOffset = useBattleProblemStore((state) => state.timeOffset);

  const battleId = problem?.battleId;
  const duration = problem?.duration;
  const startedAt = problem?.startedAt;

  return (
    <header className="relative z-50 flex w-full items-center justify-between rounded-2xl px-5 text-base-primary backdrop-blur dark:shadow-slate-950/40">
      <div className="flex items-center gap-3">
        <img src={logo} alt="TADAK 로고" className="h-12 w-auto" />
        <span className="text-2xl font-black tracking-tight">TADAK</span>
      </div>

      <div className="flex items-center gap-3">
        <BattleTimer
          battleId={battleId}
          duration={duration}
          startedAt={startedAt}
          timeOffset={timeOffset}
          roomId={roomId}
        />
      </div>

      <div className="flex items-center gap-3">
        <SpectatorCountBadge />
        <button
          onClick={onLeaveClick}
          className="inline-flex h-10 w-20 items-center justify-center rounded-full bg-base-faint text-sm font-bold text-base-primary transition hover:brightness-110"
        >
          나가기
        </button>
        <BattleSettingsMenu theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
}

export default memo(BattleHeader);
