import { Eye, Moon, Sun, Timer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import logo from '@/assets/logo.png';
import { useBattleSocketStore } from '@/stores/battleSocketStore';

interface BattleHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function BattleHeader({ theme, onToggleTheme }: BattleHeaderProps) {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const leaveRoom = useBattleSocketStore((state) => state.leaveRoom);
  const spectatorCount = useBattleSocketStore((state) => state.spectatorCount);

  const handleLeave = () => {
    if (roomId) {
      leaveRoom(roomId);
    }
    navigate('/');
  };

  return (
    <header className="flex w-full items-center justify-between rounded-2xl px-5 text-base-primary backdrop-blur dark:shadow-slate-950/40">
      <div className="flex items-center gap-3">
        <img src={logo} alt="CodeRENA 로고" className="h-11 w-40 object-contain" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-3xl bg-green-01 px-4 py-1 text-lg font-bold text-green-06 shadow-[1px_1px_4px_rgba(0,0,0,0.05)]">
          <Timer className="h-5 w-5" strokeWidth={2.5} />
          <span className="font-bold leading-7">27:16</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-base-faint px-5 py-2 text-sm font-medium text-base-primary">
          <Eye className="h-4 w-4 text-base-secondary" strokeWidth={2.5} />
          <span className="text-base-primary">{spectatorCount}</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-base-faint text-base-primary transition hover:brightness-110"
          aria-label="테마 전환"
        >
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <button
          onClick={handleLeave}
          className="inline-flex h-10 w-20 items-center justify-center rounded-full bg-base-faint text-sm font-bold text-base-primary transition hover:brightness-110"
        >
          나가기
        </button>
      </div>
    </header>
  );
}

export default BattleHeader;
