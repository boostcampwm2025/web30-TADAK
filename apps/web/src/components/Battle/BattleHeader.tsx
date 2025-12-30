import { useNavigate, useParams } from 'react-router-dom';

import { useBattleSocketStore } from '@/stores/battleSocketStore';

function BattleHeader() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const leaveRoom = useBattleSocketStore((state) => state.leaveRoom);

  const handleLeave = () => {
    if (roomId) {
      leaveRoom(roomId);
    }
    navigate('/');
  };

  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-lg shadow-slate-950/40 backdrop-blur">
      <div className="flex w-full flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Battle
            </p>
            <h1 className="text-lg font-bold text-white">CODE RENA</h1>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <div className="flex items-center gap-3 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-inner shadow-black/50">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-emerald-300">
              남은 시간
            </span>
            <span className="text-lg text-emerald-300">27:16</span>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-rose-200">
          ● LIVE
        </span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">관전자 23명</span>
        <button
          onClick={handleLeave}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          나가기
        </button>
      </div>
    </header>
  );
}

export default BattleHeader;
