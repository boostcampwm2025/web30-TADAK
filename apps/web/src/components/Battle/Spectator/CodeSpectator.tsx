import { BATTLE_EVENTS } from '@shared/constants/battle';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

function CodeSpectator() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const roomId = roomIdParam ?? searchParams.get('roomId') ?? 'room-unknown';
  const { players, codes } = useRoomStore((state) => state);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const socket = useBattleSocketStore((state) => state.socket);
  const connect = useBattleSocketStore((state) => state.connect);

  useEffect(() => {
    const client = socket ?? connect();
    const { upsertCode } = useRoomStore.getState();

    const handleCodeUpdate = (payload: {
      roomId: string;
      userId: string;
      code: string;
      language: string;
    }) => {
      if (payload.roomId !== roomId) return;
      upsertCode(payload.userId, payload.code);
      if (!selectedId) {
        setSelectedId(payload.userId);
      }
    };
    client.on(BATTLE_EVENTS.CODE_UPDATED, handleCodeUpdate);

    return () => {
      client.off(BATTLE_EVENTS.CODE_UPDATED, handleCodeUpdate);
    };
  }, [connect, roomId, selectedId, socket]);

  const activeSelectedId = selectedId ?? players[0]?.userId ?? null;
  const selectedCode = activeSelectedId ? (codes[activeSelectedId] ?? '') : '';

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/40">
        <div className="grid gap-3 md:grid-cols-2">
          {players.map((player) => (
            <button
              key={player.userId}
              type="button"
              onClick={() => setSelectedId(player.userId)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                selectedId === player.userId
                  ? 'border-emerald-500/70 bg-slate-900 shadow-lg shadow-emerald-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white bg-emerald-500`}
                >
                  {player.userId[0]}
                </span>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">{player.username}</p>
                  {/* <p className="text-xs font-semibold text-amber-300">🏅 {player.tier}</p> */}
                  <p className="text-[11px] text-slate-400">
                    {/* {player.progress.passedCount}/{player.progress.totalCount} 통과 */}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm font-semibold text-white">
                {/* <span>{player.progress.passedCount / player.progress.totalCount}%</span> */}
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
                  <span
                    className={`block h-full rounded-full bg-rose-500`}
                    // style={{ width: `${player.progress}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-inner shadow-slate-950/50">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-emerald-300">🧑‍💻</span>
              <span>{players.find((p) => p.userId === selectedId)?.username}의 코드</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">JavaScript</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">읽기 전용</span>
            </div>
          </div>

          <div className="min-h-[420px] rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm leading-relaxed text-slate-100">
            <pre className="whitespace-pre-wrap">{selectedCode}</pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-300">
                ● {/* {selected.progress.passedCount} */}개 테스트 통과
              </span>
              <span className="flex items-center gap-1 text-rose-300">
                ● {/* {selected.progress.totalCount - selected.progress.passedCount} */}개 실패
              </span>
            </div>
            <span>마지막 업데이트: 방금 전</span>
          </div>
        </div>
      </section>
    </>
  );
}

export default CodeSpectator;
