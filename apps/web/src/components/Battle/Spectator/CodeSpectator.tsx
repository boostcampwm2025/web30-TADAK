import { BATTLE_EVENTS } from '@shared/constants/battle';
import type { FinalResultMessage } from '@shared/types/pubsub';
import { Code } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

import ProgressBarSpectator from './ProgressBarSpectator';

type SubmissionResultPayload = Omit<FinalResultMessage, 'type'> & {
  userId?: string;
};

function CodeSpectator() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const roomId = roomIdParam ?? searchParams.get('roomId') ?? 'room-unknown';
  const { players, codes } = useRoomStore((state) => state);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const socket = useBattleSocketStore((state) => state.socket);
  const connect = useBattleSocketStore((state) => state.connect);
  const progresses = useBattleProgressStore((state) => state.progresses);
  const upsertProgress = useBattleProgressStore((state) => state.upsertProgress);

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

  useEffect(() => {
    const client = socket ?? connect();

    const handleSubmissionResult = (payload: SubmissionResultPayload) => {
      if (payload.userId && payload.result) {
        upsertProgress(payload.userId, {
          passed: payload.result.passed,
          total: payload.result.total,
        });
      }
    };

    client.on('submission-result', handleSubmissionResult);

    return () => {
      client.off('submission-result', handleSubmissionResult);
    };
  }, [socket, connect, upsertProgress]);

  const participants = useMemo(() => {
    if (players.length > 0) return players.slice(0, 2);
    return [
      {
        roomId: roomId,
        role: 'spectator',
        userId: 'player-a',
        username: 'Player A',
        avatarUrl: undefined,
      },
      {
        roomId: roomId,
        role: 'spectator',
        userId: 'player-b',
        username: 'Player B',
        avatarUrl: undefined,
      },
    ];
  }, [players, roomId]);

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
  const selectedProgress = activeSelectedId ? progresses[activeSelectedId] : null;

  return (
    <>
      <section className="flex flex-col gap-4 overflow-hidden rounded-2xl text-base-primary xl:h-full xl:min-h-0">
        <ProgressBarSpectator
          participants={participants}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

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
          <div className="flex items-center justify-end gap-4 border-t border-border-soft bg-(--bg-layer-2) px-4 py-3 text-xs text-base-secondary">
            <span className="flex items-center gap-1 text-green-05">
              ● {selectedProgress?.passed ?? 0}개 테스트 통과
            </span>
            <span className="flex items-center gap-1 text-pink-05">
              ● {(selectedProgress?.total ?? 0) - (selectedProgress?.passed ?? 0)}개 실패
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

export default CodeSpectator;
