import { Crown, Diamond, Medal, Shield, Sparkles, Star, Trophy } from 'lucide-react';

type TierType = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Ruby' | 'Master';

interface TierBadgeProps {
  tier: TierType;
}

// TODO: 티어별 임시 아이콘
const tierConfig = {
  Bronze: {
    icon: Medal,
    colorClass: 'text-tier-bronze',
    fillClass: 'fill-tier-bronze',
  },
  Silver: {
    icon: Shield,
    colorClass: 'text-tier-silver',
    fillClass: 'fill-tier-silver',
  },
  Gold: {
    icon: Trophy,
    colorClass: 'text-tier-gold',
    fillClass: 'fill-tier-gold',
  },
  Platinum: {
    icon: Star,
    colorClass: 'text-tier-platinum',
    fillClass: 'fill-tier-platinum',
  },
  Diamond: {
    icon: Diamond,
    colorClass: 'text-tier-diamond',
    fillClass: 'fill-tier-diamond',
  },
  Ruby: {
    icon: Sparkles,
    colorClass: 'text-tier-ruby',
    fillClass: 'fill-tier-ruby',
  },
  Master: {
    icon: Crown,
    colorClass: 'text-tier-master',
    fillClass: 'fill-tier-master',
  },
};

function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1">
      <Icon size={12} className={`${config.fillClass} ${config.colorClass}`} />
      <span className={`font-semibold ${config.colorClass} text-sm`}>{tier}</span>
    </div>
  );
}

export default TierBadge;
