import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useRoomStore } from '@/stores/roomStore';

function ProgressBar() {
  const me = useRoomStore((state) => state.me);
  const players = useRoomStore((state) => state.players);
  const progresses = useBattleProgressStore((state) => state.progresses);

  const opponent = players.find((p) => p.userId !== me?.userId);

  const myProgress = me?.userId ? progresses[me.userId] : null;
  const opponentProgress = opponent?.userId ? progresses[opponent.userId] : null;

  const myPercent = myProgress?.total
    ? Math.round((myProgress.passed / myProgress.total) * 100)
    : 0;
  const opponentPercent = opponentProgress?.total
    ? Math.round((opponentProgress.passed / opponentProgress.total) * 100)
    : 0;

  return (
    <div className="flex w-full flex-row gap-5">
      {/* 나의 진행률 */}
      <div className="flex min-w-55 flex-1 items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-base-primary">
          {me?.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt={me.username}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-05 text-[10px] font-bold text-white">
              {me?.username?.charAt(0).toUpperCase() ?? 'Y'}
            </div>
          )}
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-base-muted">
          <span className="absolute left-0 top-0 h-full w-full bg-[rgba(34,197,94,0.2)]" />
          <span
            className="absolute left-0 top-0 h-full bg-green-05 transition-all duration-300"
            style={{ width: `${myPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-base-primary">
          <span>{myPercent}%</span>
        </div>
      </div>

      {/* 상대방 진행률 */}
      <div className="flex min-w-55 flex-1 items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-base-primary">
          {opponent?.avatarUrl ? (
            <img
              src={opponent.avatarUrl}
              alt={opponent.username}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-05 text-[10px] font-bold text-white">
              {opponent?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-base-muted">
          <span className="absolute left-0 top-0 h-full w-full bg-[rgba(244,63,94,0.2)]" />
          <span
            className="absolute left-0 top-0 h-full bg-pink-05 transition-all duration-300"
            style={{ width: `${opponentPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-pink-05">
          <span>{opponentPercent}%</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
