import { SOCKET_EVENT } from '@shared/constants/socket-event';
import { useEffect, useMemo } from 'react';
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
  const joinRoom = useBattleSocketStore((state) => state.joinRoom);
  const connect = useBattleSocketStore((state) => state.connect);
  const user = useUserStore((state) => state.user);

  const roomId = roomIdParam ?? searchParams.get('roomId') ?? '1';
  const desiredRole = useMemo(() => (isSpectator ? 'spectator' : 'player'), [isSpectator]);

  useEffect(() => {
    const ensureJoin = async () => {
      // 세션 복구 시도
      await resumeSession({ roomId, roleHint: desiredRole });

      const currentMe = useRoomStore.getState().me;
      const needsJoin = !currentMe || currentMe.roomId !== roomId || currentMe.role !== desiredRole;

      if (needsJoin) {
        await joinRoom({
          roomId,
          requestedRole: desiredRole,
          userId: user?.id,
          username: user?.username,
          avatarUrl: user?.avatarUrl,
        });
      }
    };

    // 최초 실행
    ensureJoin().catch(() => {
      // 실패 시 사용자가 수동으로 재시도하게 둠
    });

    // 소켓 연결/재연결 시에도 다시 방 입장을 보장
    const client = connect();
    const handleReconnect = () => {
      ensureJoin().catch(() => {});
    };
    client.on(SOCKET_EVENT.CONNECT, handleReconnect);

    return () => {
      client.off(SOCKET_EVENT.CONNECT, handleReconnect);
    };
  }, [
    connect,
    desiredRole,
    joinRoom,
    resumeSession,
    roomId,
    user?.avatarUrl,
    user?.id,
    user?.username,
  ]);

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
