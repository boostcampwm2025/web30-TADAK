import type { TierType } from '@shared/types/user';

import { tierConfig } from '@/constants/tier';

interface TierBadgeProps {
  tier: TierType;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1">
      <Icon size={12} className={`${config.fillClass} ${config.colorClass}`} />
      <span className={`font-semibold ${config.colorClass} text-sm`}>{tier}</span>
    </div>
  );
}

export default TierBadge;
