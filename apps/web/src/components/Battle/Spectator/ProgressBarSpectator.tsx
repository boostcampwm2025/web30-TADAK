import { Trophy } from 'lucide-react';

import { useBattleProgressStore } from '@/stores/battleProgressStore';

type Participant = {
  userId: string;
  username: string;
  avatarUrl?: string;
};

type Props = {
  participants: Participant[];
  selectedId: string | null;
  onSelect: (userId: string) => void;
};

function ProgressBarSpectator({ participants, selectedId, onSelect }: Props) {
  const progresses = useBattleProgressStore((state) => state.progresses);

  const participantCards = participants.map((p, idx) => {
    const progress = progresses[p.userId];
    const percent = progress?.total ? Math.round((progress.passed / progress.total) * 100) : 0;
    return {
      ...p,
      percent,
      passed: progress?.passed ?? 0,
      total: progress?.total ?? 0,
      color: idx === 0 ? 'var(--color-green-05)' : 'var(--color-pink-05)',
      bg: idx === 0 ? 'bg-[var(--color-green-05)]' : 'bg-[var(--color-pink-05)]',
    };
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {participantCards.map((player) => (
        <button
          key={player.userId}
          type="button"
          onClick={() => onSelect(player.userId)}
          className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
            selectedId === player.userId
              ? 'border-green-05 bg-(--bg-layer-2)'
              : 'border-border-soft bg-(--bg-layer-2) hover:brightness-105'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${player.bg} overflow-hidden`}
              >
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  player.userId[0]
                )}
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
  );
}

export default ProgressBarSpectator;
