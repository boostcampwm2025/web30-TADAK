import type { Battle } from '@shared/types/battle';

interface ActiveBattleCardProps {
  battle: Battle;
  onJoin: (roomId: string) => void;
}

function getElapsedMinutes(startedAt: Date | undefined): number {
  const now = Date.now();
  return Math.floor((now - new Date(startedAt || now).getTime()) / 60000);
}

export default function ActiveBattleCard({ battle, onJoin }: ActiveBattleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onJoin(battle.roomId)}
      className="bg-base-faint rounded-xl p-6 hover:bg-base-lower transition-colors cursor-pointer text-left"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-01 animate-pulse" />
          <span className="text-sm font-semibold text-red-01">LIVE</span>
        </div>
        <span className="text-sm text-base-primary">
          {getElapsedMinutes(battle.startedAt)}분 전
        </span>
      </div>

      <div className="flex items-center gap-4">
        {battle.users.slice(0, 2).map((user) => (
          <div key={user.userId} className="flex-1">
            <div className="flex items-center gap-2">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <div className="text-lg font-bold truncate">{user.username}</div>
            </div>
            <div className="mt-2 text-sm text-base-secondary">
              진행률: {user.progress.passedCount}/{user.progress.totalCount}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-base-primary">관전하기</div>
    </button>
  );
}
