import type { Room } from '@shared/types/room';
import { Eye } from 'lucide-react';

type Props = {
  rooms: Room[];
  onSpectate?: (roomId: string) => void;
  joiningRoomId?: string | null;
};

const getInitial = (name?: string) => name?.trim().charAt(0)?.toUpperCase() ?? '?';

function RoomCardList({ rooms, onSpectate, joiningRoomId }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {rooms.map((room) => {
        const players = room.currentPlayers?.slice(0, 2) ?? [];
        return (
          <div
            key={room.roomId}
            className="rounded-2xl bg-bg-layer-2 border border-border-soft px-5 py-4 shadow-sm transition hover:shadow-md"
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
                      <span className="text-sm font-semibold text-base-primary">{p.username}</span>
                      <span className="text-xs text-base-secondary">🏆 Gold III</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-base-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${idx === 0 ? 75 : 60}%`,
                        backgroundColor: idx === 0 ? '#00e074' : '#ff6584',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onSpectate ? () => onSpectate(room.roomId) : undefined}
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-base-muted px-4 py-3 text-sm font-semibold transition hover:bg-base-primary/50 disabled:opacity-50"
              disabled={!onSpectate || joiningRoomId === room.roomId}
            >
              {joiningRoomId === room.roomId ? '입장 중...' : '관전하기'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default RoomCardList;
