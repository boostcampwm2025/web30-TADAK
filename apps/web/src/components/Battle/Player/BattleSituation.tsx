import { BATTLE_EVENTS } from '@shared/constants/battle';
import { Activity, BarChart3, ListChecks } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

function BattleSituation() {
  const me = useRoomStore((state) => state.me);
  const players = useRoomStore((state) => state.players);
  const codes = useRoomStore((state) => state.codes);
  const upsertCode = useRoomStore((state) => state.upsertCode);
  const progresses = useBattleProgressStore((state) => state.progresses);
  const socket = useBattleSocketStore((state) => state.socket);

  const opponent = useMemo(
    () => players.find((p) => p.userId !== me?.userId),
    [players, me?.userId],
  );

  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (payload: { userId: string; code: string }) => {
      if (payload.userId !== me?.userId) {
        upsertCode(payload.userId, payload.code);
      }
    };

    socket.on(BATTLE_EVENTS.CODE_UPDATED, handleCodeUpdate);
    return () => {
      socket.off(BATTLE_EVENTS.CODE_UPDATED, handleCodeUpdate);
    };
  }, [socket, me?.userId, upsertCode]);

  const codeLines = useMemo(() => {
    if (!opponent?.userId) return 0;
    const code = codes[opponent.userId] ?? '';
    return code.split('\n').filter((line) => line.trim().length > 0).length;
  }, [codes, opponent?.userId]);

  const submitLogs = opponent?.userId ? (progresses[opponent.userId]?.submitLogs ?? []) : [];

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const status = useMemo(() => {
    if (!opponent?.userId) return '대기 중';
    if (codeLines > 0) return '코딩 중';
    return '대기 중';
  }, [opponent?.userId, codeLines]);

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
            <p className="text-sm">{status}</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-base-primary">
              <div className="rounded-lg  bg-base-primary/5 px-3 py-2">
                <p className="text-base-secondary">코드 라인</p>
                <p className="text-lg text-base-primary">{codeLines}</p>
              </div>
              <div className="rounded-lg  bg-base-primary/5 px-3 py-2">
                <p className="text-base-secondary">제출 횟수</p>
                <p className="text-lg text-base-primary">{submitLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col space-y-3 text-sm leading-relaxed text-base-primary">
          <div className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-green-05" strokeWidth={2.5} />
            <p className="font-semibold text-green-05">활동 기록</p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto rounded-md bg-base-primary/5 p-3 text-xs text-base-primary">
            {submitLogs.length === 0 ? (
              <p className="text-center text-base-secondary py-2">아직 활동 기록이 없습니다</p>
            ) : (
              [...submitLogs].reverse().map((log, idx) => (
                <div
                  key={log.timestamp}
                  className="flex items-center justify-between rounded-lg bg-(--bg-layer-2) px-3 py-2"
                >
                  <span>
                    코드 제출 #{submitLogs.length - idx}{' '}
                    <span className={log.passed === log.total ? 'text-green-05' : 'text-pink-05'}>
                      ({log.passed}/{log.total})
                    </span>
                  </span>
                  <span className="text-base-secondary">{formatTime(log.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto space-y-3 text-sm leading-relaxed text-base-primary">
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
