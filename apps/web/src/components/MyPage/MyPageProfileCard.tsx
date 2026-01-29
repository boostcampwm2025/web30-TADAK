import type { UserProfile } from '@/apis/user';
import { tierConfig } from '@/constants/tier';

import TierBadge from '../Common/TierBadge';

interface MyPageProfileCardProps {
  user: UserProfile;
}

export function MyPageProfileCard({ user }: MyPageProfileCardProps) {
  const tierInfo = tierConfig[user.tier.tier] || tierConfig.Bronze;
  const TierIcon = tierInfo.icon;

  return (
    <div className="profile-card bg-bg-layer-2 rounded-24 p-10 text-center border border-border-soft shadow-sm">
      <div className="u-avatar-wrap relative w-[120px] h-[120px] mx-auto mb-6">
        <img
          src={user.avatarUrl}
          className="u-avatar w-full h-full rounded-[40px] object-cover bg-bg-layer-1 border-4 border-bg-layer-2 shadow-md"
          alt="Avatar"
        />
        <div className="u-tier-icon absolute -bottom-[5px] -right-[5px] bg-bg-layer-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-border-soft">
          <TierIcon className={tierInfo.colorClass} size={24} />
        </div>
      </div>
      <h2 className="u-name text-2xl font-extrabold mb-1 tracking-tight">{user.username}</h2>
      <div className="u-tier-badge bg-brand/10 text-brand px-5 py-2 rounded-full font-bold text-xs inline-flex items-center gap-2 mb-8 border border-brand/20">
        <TierBadge tier={user.tier.tier} division={user.tier.division} />
      </div>

      <div className="stats-grid grid grid-cols-2 gap-3">
        <div className="stat-item bg-bg-layer-1 p-4 rounded-24 text-left">
          <span className="stat-label text-[11px] font-bold text-base-tertiary uppercase block mb-1">
            Rating
          </span>
          <span className="stat-value text-lg font-extrabold">{user.rating.toLocaleString()}</span>
        </div>
        <div className="stat-item bg-bg-layer-1 p-4 rounded-24 text-left">
          <span className="stat-label text-[11px] font-bold text-base-tertiary uppercase block mb-1">
            Win Rate
          </span>
          <span className="stat-value text-lg font-extrabold">
            {Math.round((user.wins / (user.wins + user.losses || 1)) * 100)}%
          </span>
        </div>
        <div className="stat-item bg-bg-layer-1 p-4 rounded-24 text-left">
          <span className="stat-label text-[11px] font-bold text-base-tertiary uppercase block mb-1">
            Win
          </span>
          <span className="stat-value text-lg font-extrabold text-brand">{user.wins}</span>
        </div>
        <div className="stat-item bg-bg-layer-1 p-4 rounded-24 text-left">
          <span className="stat-label text-[11px] font-bold text-base-tertiary uppercase block mb-1">
            Loss
          </span>
          <span className="stat-value text-lg font-extrabold text-red-01">{user.losses}</span>
        </div>
      </div>
    </div>
  );
}
