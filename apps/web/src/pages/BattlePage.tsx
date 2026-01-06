import { useSearchParams } from 'react-router-dom';

import BattleHeader from '@/components/Battle/BattleHeader';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import { useTheme } from '@/hooks/useTheme';

function BattlePage() {
  const [searchParams] = useSearchParams();
  const isSpectator = searchParams.get('mode') === 'spectator';
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-svh overflow-auto text-ink dark:bg-slate-950 dark:text-slate-50 xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-svh bg-base-muted flex-col gap-3 px-3 py-3 xl:h-full xl:w-full xl:gap-4 xl:px-6 xl:py-4">
        <BattleHeader theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectator ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
    </div>
  );
}

export default BattlePage;
