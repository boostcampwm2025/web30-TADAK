import type { TierType } from '@shared/types/user';

import TierBadge from '@/components/Common/TierBadge';
import { getOptimizedAvatarUrl } from '@/lib/avatar';

interface UserProfileProps {
  username: string;
  tier?: TierType;
  division?: number;
  avatarUrl?: string;
}

export function UserProfile({ username, tier, division, avatarUrl }: UserProfileProps) {
  const optimizedAvatarUrl = getOptimizedAvatarUrl(avatarUrl, 80);

  return (
    <div className="flex items-center gap-3 px-4">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-green-500" />
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-lg font-bold text-green-500 shadow-sm">
          {optimizedAvatarUrl ? (
            <img
              src={optimizedAvatarUrl}
              alt={`${username} 프로필`}
              width={40}
              height={40}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-base font-bold text-base-primary">{username}</span>
        {tier && <TierBadge tier={tier} division={division} />}
      </div>
    </div>
  );
}
