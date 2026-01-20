import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import BattleHeader from '@/components/Battle/BattleHeader';
import BattlePlayer from '@/components/Battle/Player/BattlePlayer';
import BattleSpectator from '@/components/Battle/Spectator/BattleSpectator';
import { useTheme } from '@/hooks/useTheme';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUserStore } from '@/stores/userStore';

function BattlePage() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const isSpectator = searchParams.get('mode') === 'spectator';
  const { theme, toggleTheme } = useTheme();
  const resumeSession = useBattleSocketStore((state) => state.resumeSession);
  const connect = useBattleSocketStore((state) => state.connect);
  const joinRoom = useBattleSocketStore((state) => state.joinRoom);
  const user = useUserStore((state) => state.user);
  const me = useRoomStore((state) => state.me);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';

  useEffect(() => {
    if (me) return;
    const desiredRole = isSpectator ? 'spectator' : 'player';
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
        <BattleHeader theme={theme} onToggleTheme={toggleTheme} showLeaveConfirm={!isSpectator} />
        <div className="flex-1 min-h-0 overflow-visible xl:overflow-hidden">
          {isSpectator ? <BattleSpectator /> : <BattlePlayer />}
        </div>
      </div>
    </div>
  );
}

export default BattlePage;
