import { LogIn } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Modal from '@/components/Common/Modal';
import Header from '@/components/Header/Header';
import RoomCardList from '@/components/Main/RoomCardList';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useUserStore } from '@/stores/userStore';

const tierFilters = [
  { label: '전체', color: 'bg-green-05' },
  { label: '브론즈', color: 'bg-tier-bronze' },
  { label: '실버', color: 'bg-tier-silver' },
  { label: '골드', color: 'bg-tier-gold' },
  { label: '플래티넘', color: 'bg-tier-platinum' },
  { label: '다이아몬드', color: 'bg-tier-diamond' },
  { label: '마스터', color: 'bg-tier-master' },
];

function MainPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const connect = useBattleSocketStore((state) => state.connect);
  const subscribeRoomList = useBattleSocketStore((state) => state.subscribeRoomList);
  const unsubscribeRoomList = useBattleSocketStore((state) => state.unsubscribeRoomList);
  const requestRoomList = useBattleSocketStore((state) => state.requestRoomList);
  const rooms = useBattleSocketStore((state) => state.rooms);
  const socket = useBattleSocketStore((state) => state.socket);

  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const ensureSocketReady = useCallback(async () => {
    const activeSocket = socket ?? connect();
    if (!activeSocket.connected) {
      await new Promise<void>((resolve) => activeSocket.once('connect', () => resolve()));
    }
    return activeSocket;
  }, [socket, connect]);

  useEffect(() => {
    let mounted = true;
    ensureSocketReady()
      .then(() => {
        if (!mounted) return;
        subscribeRoomList();
        requestRoomList();
      })
      .catch(() => {});

    return () => {
      mounted = false;
      unsubscribeRoomList();
    };
  }, [subscribeRoomList, requestRoomList, ensureSocketReady, unsubscribeRoomList]);

  const stats = useMemo(() => {
    const totalBattles = rooms.length;
    const totalSpectators = rooms.reduce(
      (sum, room) => sum + (room.currentSpectators?.length ?? 0),
      0,
    );
    const totalPlayers = rooms.reduce((sum, room) => sum + (room.currentPlayers?.length ?? 0), 0);
    return { totalBattles, totalSpectators, totalPlayers };
  }, [rooms]);

  const handleStartBattle = () => {
    if (!user?.id) {
      setShowLoginModal(true);
      return;
    }

    navigate('/matching');
  };

  const handleJoinSpectator = async (roomId: string) => {
    setJoiningRoomId(roomId);
    try {
      await ensureSocketReady();
      navigate(`/room/${roomId}?mode=spectator`);
    } catch (error) {
      console.error('관전 입장 실패:', error);
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg-layer-1">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 lg:px-8">
        {/* 상단 헤더 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-01" />
            <h1 className="text-3xl font-bold">LIVE</h1>
            <h1 className="text-3xl font-bold text-brand">BATTLES</h1>
            <button
              type="button"
              onClick={handleStartBattle}
              className="ml-auto rounded-3xl bg-brand px-6 py-3 text-lg font-semibold shadow-md transition hover:scale-[1.02]"
            >
              게임 시작하기
            </button>
          </div>
          <p className="text-sm text-base-primary">
            현재 진행 중인 배틀을 관전하고 고수들의 코딩을 배워보세요
          </p>
        </div>

        {/* 티어 필터 (동작 없음, UI만) */}
        <div className="flex flex-wrap gap-2">
          {tierFilters.map((tier, idx) => (
            <button
              key={tier.label}
              type="button"
              className={`rounded-full px-4 py-2 text-xs font-semibold text-base-primary shadow-sm ${
                idx === 0 ? 'bg-green-01 text-green-06' : 'bg-base-faint text-base-secondary'
              }`}
            >
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${tier.color}`} />
              {tier.label}
            </button>
          ))}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: '진행 중인 배틀', value: stats.totalBattles },
            { label: '총 관전자', value: stats.totalSpectators },
            { label: '참가 중인 플레이어', value: stats.totalPlayers },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-bg-layer-2 border border-border-soft px-6 py-4 shadow-sm"
            >
              <p className="text-3xl font-bold text-green-05">{item.value}</p>
              <p className="mt-1 text-sm text-base-secondary">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 방 카드 리스트 */}
        {rooms.length === 0 ? (
          <div className="rounded-2xl bg-bg-layer-2 border border-border-soft px-6 py-8 text-center text-base-secondary shadow-sm">
            현재 진행 중인 배틀이 없습니다.
          </div>
        ) : (
          <RoomCardList
            rooms={rooms}
            onSpectate={handleJoinSpectator}
            joiningRoomId={joiningRoomId}
          />
        )}
      </main>

      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        icon={LogIn}
        title="로그인이 필요합니다"
        description="배틀을 시작하려면 로그인이 필요합니다"
        buttons={[
          {
            label: '취소',
            onClick: () => setShowLoginModal(false),
            variant: 'muted',
          },
          {
            label: '로그인하기',
            onClick: () => navigate('/login'),
            variant: 'green',
          },
        ]}
      />
    </div>
  );
}

export default MainPage;
