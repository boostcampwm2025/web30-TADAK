import { BATTLE_EVENTS } from '@shared/constants/battle';
import { Code, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

  const participants = useMemo(() => {
    if (players.length > 0) return players.slice(0, 2);
    return [
      { userId: 'player-a', username: 'Player A' },
      { userId: 'player-b', username: 'Player B' },
    ];
  }, [players]);

  const firstParticipantId = participants[0]?.userId ?? null;

  useEffect(() => {
    if (!firstParticipantId) return;
    const exists = participants.some((p) => p.userId === selectedId);
    if (!selectedId || !exists) {
      const timer = setTimeout(() => {
        setSelectedId(firstParticipantId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [firstParticipantId, participants, selectedId]);

  const activeSelectedId = selectedId ?? firstParticipantId;
  const selectedCode = activeSelectedId ? (codes[activeSelectedId] ?? '') : '';

  const participantCards = useMemo(
    () =>
      participants.map((p, idx) => ({
        ...p,
        percent: 75,
        color: idx === 0 ? 'var(--color-green-05)' : 'var(--color-pink-05)',
        bg: idx === 0 ? 'bg-[var(--color-green-05)]' : 'bg-[var(--color-pink-05)]',
      })),
    [participants],
  );

  return (
    <>
      <section className="flex flex-col gap-4 overflow-hidden rounded-2xl text-base-primary xl:h-full xl:min-h-0">
        <div className="grid gap-3 sm:grid-cols-2">
          {participantCards.map((player) => (
            <button
              key={player.userId}
              type="button"
              onClick={() => setSelectedId(player.userId)}
              className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                selectedId === player.userId
                  ? 'border-green-05 bg-(--bg-layer-2)'
                  : 'border-border-soft bg-(--bg-layer-2) hover:brightness-105'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${player.bg}`}
                  >
                    {player.userId[0]}
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-base-primary">{player.username}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <Trophy className="h-4 w-4" />
                      <span>Gold</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-base-primary">{player.percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-base-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${player.percent}%`, backgroundColor: player.color }}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-(bg-layer-2) text-base-primary shadow-inner shadow-slate-950/10 xl:flex-1 xl:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft bg-(--bg-layer-2) px-4 py-3 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-05" strokeWidth={2.5} />
              <span className="rounded pr-3 text-sm font-bold text-green-05">코드 에디터</span>
              <span className="text-color-green-05">
                {participants.find((p) => p.userId === selectedId)?.username ?? '관전자'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-base-secondary">
              <span className="rounded-full bg-base-muted px-3 py-1 text-base-primary">
                JavaScript
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-(--bg-layer-2) px-4 py-3 font-mono text-sm leading-relaxed text-base-primary">
            <pre className="chat-scroll h-full min-h-[clamp(260px,50vh,520px)] whitespace-pre-wrap overflow-y-auto">
              {selectedCode}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft bg-(--bg-layer-2) px-4 py-3 text-xs text-base-secondary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-green-05">
                ● {/* {selected.progress.passedCount} */}개 테스트 통과
              </span>
              <span className="flex items-center gap-1 text-pink-05">
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
