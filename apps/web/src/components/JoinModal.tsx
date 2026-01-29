import type { UserRole } from '@shared/types/user';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, Eye, LogIn, UserRound, X } from 'lucide-react';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  onSelect: (role: UserRole) => void;
}

function RoleCard({
  role,
  title,
  description,
  badge,
  icon: Icon,
  active,
  disabled,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-3 rounded-2xl border px-6 py-6 text-center shadow-sm transition ${
        active
          ? 'border-transparent bg-participant-card shadow-lg shadow-indigo-200'
          : 'border-neutral-card bg-white hover:-translate-y-0.5 hover:shadow-md'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full ${
          active
            ? 'bg-participant-icon text-white shadow'
            : 'border border-neutral-card bg-white text-slate-300'
        }`}
        aria-hidden
      >
        {active && <Check size={16} strokeWidth={2.4} />}
      </span>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          active
            ? 'bg-participant-icon text-white'
            : 'border-neutral-card bg-white text-spectator-icon border shadow-sm'
        }`}
      >
        <Icon size={24} strokeWidth={2.2} />
      </div>
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <div className="inline-flex items-center gap-2 rounded-full bg-participant-badge px-3 py-1 text-xs font-bold text-white">
        {badge}
      </div>
      <p className="text-sm text-slate-600">{description}</p>
    </button>
  );
}

interface JoinModalProps {
  open: boolean;
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
  onJoin: () => void;
  joining?: boolean;
  error?: string;
  participants: { count: number; limit: number };
  spectators: { count: number; limit: number };
}

export function JoinModal({
  open,
  selectedRole,
  onSelectRole,
  onClose,
  onJoin,
  joining = false,
  error,
  participants,
  spectators,
}: JoinModalProps) {
  const roleOptions: RoleCardProps[] = [
    {
      role: 'player',
      title: '참가자',
      description: '대결에 직접 참여하고 준비가 되면 시작',
      badge: `${participants.count}/${participants.limit}`,
      icon: UserRound,
      active: selectedRole === 'player',
      disabled: participants.count >= participants.limit,
      onSelect: onSelectRole,
    },
    {
      role: 'spectator',
      title: '관전자',
      description: '대결을 관전하고 채팅에 참여',
      badge: spectators.limit === Infinity ? '무제한' : `${spectators.count}/${spectators.limit}`,
      icon: Eye,
      active: selectedRole === 'spectator',
      disabled: false,
      onSelect: onSelectRole,
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-overlay px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-soft bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-linear-to-r from-white to-slate-50 px-6 py-5 border-b-black/5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-modal-accent text-white shadow">
              <LogIn size={20} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-slate-900">입장 방법 선택</p>
              <p className="text-xs text-slate-500">역할을 선택하고 대결방에 입장하세요</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-10 sm:grid-cols-2">
          {roleOptions.map((option) => (
            <RoleCard key={option.role} {...option} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-card bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            취소
          </button>
          <button
            type="button"
            disabled={joining}
            onClick={onJoin}
            className="w-full rounded-xl bg-cta-modal px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <ArrowRight size={18} strokeWidth={2.4} />
              {joining ? '입장 중...' : '입장하기'}
            </span>
          </button>
        </div>

        {error && (
          <div className="border-t border-neutral-card bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
