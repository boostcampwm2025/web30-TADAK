import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import BattleHeader from '@/components/Battle/BattleHeader';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import { useTheme } from '@/hooks/useTheme';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

function BattlePage() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const isSpectator = searchParams.get('mode') === 'spectator';
  const { theme, toggleTheme } = useTheme();
  const resumeSession = useBattleSocketStore((state) => state.resumeSession);
  const me = useRoomStore((state) => state.me);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';

  useEffect(() => {
    if (me) return;
    resumeSession({ roomId, roleHint: isSpectator ? 'spectator' : 'player' }).catch(() => {
      // 복구 실패 시 무시하고 사용자가 다시 입장하게 둡니다.
    });
  }, [me, resumeSession, roomId, isSpectator]);

  return (
    <div className="min-h-svh overflow-auto xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-svh flex-col gap-3 px-3 py-3 xl:h-full xl:w-full xl:gap-4 xl:px-6 xl:py-4">
        <BattleHeader theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectator ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
    </div>
  );
}

export default BattlePage;
