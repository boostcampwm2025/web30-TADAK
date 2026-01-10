import type { Room } from '@shared/types/room';
import { Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/Header/Header';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

// 색상 값은 임시 값 입니다 (추후에 index.css에 정의 후 사용 예정)
const tierFilters = [
  { label: '전체', color: 'bg-green-05' },
  { label: '브론즈', color: 'bg-[#d78b4c]' },
  { label: '실버', color: 'bg-[#a7b3c2]' },
  { label: '골드', color: 'bg-[#f2c94c]' },
  { label: '플래티넘', color: 'bg-[#27ae60]' },
  { label: '다이아몬드', color: 'bg-[#56ccf2]' },
  { label: '루비', color: 'bg-[#ff6584]' },
  { label: '마스터', color: 'bg-[#9b51e0]' },
];

function MainPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const connect = useBattleSocketStore((state) => state.connect);
  const subscribeRoomList = useBattleSocketStore((state) => state.subscribeRoomList);
  const unsubscribeRoomList = useBattleSocketStore((state) => state.unsubscribeRoomList);
  const requestRoomList = useBattleSocketStore((state) => state.requestRoomList);
  const rooms = useBattleSocketStore((state) => state.rooms);

  const startMatching = useMatchingStore((state) => state.startMatching);
  const registerMatchingListeners = useMatchingStore((state) => state.registerMatchingListeners);

  const [joiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    const socket = connect();
    if (!socket.connected) socket.connect();
    subscribeRoomList();
    requestRoomList();

    return () => {
      unsubscribeRoomList();
    };
  }, [connect, subscribeRoomList, unsubscribeRoomList, requestRoomList]);

  const stats = useMemo(() => {
    const totalBattles = rooms.length;
    const totalSpectators = rooms.reduce(
      (sum, room) => sum + (room.currentSpectators?.length ?? 0),
      0,
    );
    const totalPlayers = rooms.reduce((sum, room) => sum + (room.currentPlayers?.length ?? 0), 0);
    return { totalBattles, totalSpectators, totalPlayers };
  }, [rooms]);

  const sampleFallback: Room[] = [
    {
      roomId: 'sample-1',
      title: '두 수의 합',
      hostId: 'system',
      status: 'in-battle',
      createdAt: new Date(),
      settings: { maxPlayers: 2 },
      currentPlayers: [
        {
          roomId: 'sample-1',
          role: 'player',
          userId: 'p1',
          username: 'CodeMaster',
          avatarUrl: undefined,
          socketId: '',
          joinedAt: new Date(),
        },
        {
          roomId: 'sample-1',
          role: 'player',
          userId: 'p2',
          username: 'AlgoKing',
          avatarUrl: undefined,
          socketId: '',
          joinedAt: new Date(),
        },
      ],
      currentSpectators: [],
    },
  ];

  const roomCards = rooms.length > 0 ? rooms : sampleFallback;

  const handleStartBattle = async () => {
    if (!user?.id) {
      console.error('로그인이 필요합니다.');
      return;
    }

    try {
      const socket = connect();
      if (!socket.connected) {
        await new Promise<void>((resolve) => socket.once('connect', () => resolve()));
      }
      if (!socket.id) throw new Error('Socket ID를 받지 못했습니다.');

      registerMatchingListeners(socket);
      await startMatching(user.id, socket.id);
      navigate('/matching');
    } catch (error) {
      console.error('매칭 시작 중 오류:', error);
    }
  };

  // 관전하기 입장 로직은 추후 백엔드 연동 시 추가 예정
  const handleJoinSpectator = () => {};

  const getInitial = (name?: string) => name?.trim().charAt(0)?.toUpperCase() ?? '?';

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
                idx === 0 ? 'bg-green-01 text-green-06' : 'bg-white text-base-secondary'
              }`}
            >
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${tier.color}`} />
              {tier.label}
            </button>
          ))}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-semibold text-green-05">진행 중인 배틀</p>
            <p className="mt-2 text-3xl font-bold text-green-05">{stats.totalBattles}</p>
          </div>
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-semibold text-green-05">총 관전자</p>
            <p className="mt-2 text-3xl font-bold text-green-05">{stats.totalSpectators}</p>
          </div>
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
            <p className="text-sm font-semibold text-green-05">참가 중인 플레이어</p>
            <p className="mt-2 text-3xl font-bold text-green-05">{stats.totalPlayers}</p>
          </div>
        </div>

        {/* 방 카드 리스트 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roomCards.map((room) => {
            const players = room.currentPlayers?.slice(0, 2) ?? [];
            return (
              <div
                key={room.roomId}
                className="rounded-2xl bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between text-xs text-base-secondary">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center font-semibold text-red-01">● LIVE</span>
                    <span className="text-blue-03">12:34</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-blue-03 text-sm font-medium">
                    <Eye className="h-4 w-4 text-blue-03" strokeWidth={1.5} />
                    {room.currentSpectators?.length ?? 0}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-base-primary">{room.title}</h3>
                  <span className="rounded-full bg-green-01 px-2 py-1 text-[10px] font-bold text-green-06">
                    Gold
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {players.map((p, idx) => (
                    <div key={p.userId} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-base-muted text-sm font-bold text-base-primary">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.username}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            getInitial(p.username)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-base-primary">
                            {p.username}
                          </span>
                          <span className="text-xs text-base-secondary">🏆 Gold III</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-base-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${idx === 0 ? 75 : 60}%`,
                            backgroundColor: idx === 0 ? 'bg-green-05' : 'bg-red-01',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinSpectator()}
                  className="mt-6 flex w-full items-center justify-center rounded-lg bg-base-muted px-4 py-3 text-sm font-semibold text-base-primary transition hover:brightness-105 disabled:opacity-50"
                  disabled={joiningRoomId === room.roomId}
                >
                  관전하기
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default MainPage;
