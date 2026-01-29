import { Crown, Diamond, Medal, Shield, Sparkles, Star, Trophy } from 'lucide-react';

export interface TierConfigItem {
  icon: typeof Medal;
  colorClass: string;
  fillClass: string;
}

export const tierConfig: Record<string, TierConfigItem> = {
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
