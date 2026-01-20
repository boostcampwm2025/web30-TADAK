import { Activity, BarChart3, ListChecks } from 'lucide-react';
import { useMemo } from 'react';

import { useRoomStore } from '@/stores/roomStore';

function BattleSituation() {
  const me = useRoomStore((state) => state.me);
  const players = useRoomStore((state) => state.players);
  const opponent = useMemo(
    () => players.find((p) => p.userId !== me?.userId),
    [players, me?.userId],
  );

  const { stats, totalBattles } = useMemo(() => {
    const s = opponent?.stats ?? {
      wins: 0,
      losses: 0,
      rating: 1000,
      tier: { tier: 'BRONZE', division: 4 },
    };
    return {
      stats: s,
      totalBattles: s.wins + s.losses,
    };
  }, [opponent]);

  const activityLogs = [
    { label: '코드 작성 시작', time: '00:15' },
    { label: '첫 번째 테스트 실행', time: '02:30' },
    { label: '코드 수정 중', time: '04:45' },
  ];

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl  bg-(--bg-layer-2) p-5 border border-border-soft text-base-primary xl:h-full xl:min-h-0 xl:overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-base-secondary">상대방</p>
            <p className="text-lg font-semibold text-base-primary">
              {opponent?.username ?? '대기 중'}
            </p>
          </div>
          {opponent?.avatarUrl ? (
            <img
              src={opponent.avatarUrl}
              alt={opponent.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-05 text-lg font-bold text-white">
              {opponent?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-base-primary">
          <div className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-green-05" strokeWidth={2.5} />
            <p className="font-semibold text-green-05">실시간 상태</p>
          </div>
          <div className="space-y-3 rounded-md bg-base-primary/5 p-3">
            <p className="text-sm">코딩 중...</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-base-primary">
              <div className="rounded-lg  bg-base-primary/5 px-3 py-2">
                <p className="text-base-secondary">코드 라인</p>
                <p className="text-lg text-base-primary">42</p>
              </div>
              <div className="rounded-lg  bg-base-primary/5 px-3 py-2">
                <p className="text-base-secondary">실행 횟수</p>
                <p className="text-lg text-base-primary">6</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-base-primary">
          <div className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-green-05" strokeWidth={2.5} />
            <p className="font-semibold text-green-05">활동 기록</p>
          </div>
          <div className="space-y-2 rounded-md bg-base-primary/5 p-3 text-xs text-base-primary">
            {activityLogs.map((log) => (
              <div
                key={log.label}
                className="flex items-center justify-between rounded-lg  bg-(--bg-layer-2) px-3 py-2"
              >
                <span>{log.label}</span>
                <span className="text-base-secondary">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-base-primary">
          <div className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-green-05" strokeWidth={2.5} />
            <p className="font-semibold text-green-05">상대 통계</p>
          </div>
          <div className="rounded-md bg-base-primary/5 p-3">
            <div className="mt-1 flex items-center justify-center gap-4 text-sm font-bold text-base-primary">
              <div className="text-green-05">
                {totalBattles} <span className="text-base-secondary font-semibold">배틀</span>
              </div>
              <div className="text-green-05">
                {stats.wins} <span className="text-base-secondary font-semibold">승리</span>
              </div>
              <div className="text-pink-05">
                {stats.losses} <span className="text-base-secondary font-semibold">패배</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default BattleSituation;
