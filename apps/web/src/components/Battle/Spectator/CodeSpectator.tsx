import { BATTLE_EVENTS } from '@shared/constants/battle';
import type { FinalResultMessage } from '@shared/types/pubsub';
import { memo, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import CodeSpectatorEditor from '@/components/Battle/Spectator/CodeSpectatorEditor';
import ProgressBarSpectator from '@/components/Battle/Spectator/ProgressBarSpectator';
import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

type SubmissionResultPayload = Omit<FinalResultMessage, 'type'> & {
  userId?: string;
};

function CodeSpectator() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const roomId = roomIdParam ?? searchParams.get('roomId') ?? 'room-unknown';
  const { players } = useRoomStore(
    useShallow((state) => ({
      players: state.players,
    })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { socket, connect } = useBattleSocketStore(
    useShallow((state) => ({
      socket: state.socket,
      connect: state.connect,
    })),
  );
  const { upsertProgress } = useBattleProgressStore(
    useShallow((state) => ({
      upsertProgress: state.upsertProgress,
    })),
  );

  useEffect(() => {
    const client = socket ?? connect();

    const handleCodeUpdate = (payload: {
      roomId: string;
      userId: string;
      code: string;
      language: string;
    }) => {
      if (payload.roomId !== roomId) return;
      const { upsertCode, upsertLanguage } = useRoomStore.getState();
      upsertCode(payload.userId, payload.code);
      upsertLanguage(payload.userId, payload.language);
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

  return (
    <>
      <section className="flex flex-col gap-4 overflow-hidden rounded-2xl text-base-primary xl:h-full xl:min-h-0">
        <ProgressBarSpectator
          participants={participants}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <CodeSpectatorEditor activeSelectedId={activeSelectedId} participants={participants} />
      </section>
    </>
  );
}

export default memo(CodeSpectator);
