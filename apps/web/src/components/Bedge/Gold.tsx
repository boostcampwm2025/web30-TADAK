import { Trophy } from 'lucide-react';

interface GoldProps {
  tier: string;
}

function Gold({ tier }: GoldProps) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Trophy size={14} className="fill-tier-gold text-tier-gold" />
        <span className="text-sm font-semibold text-tier-gold">{tier}</span>
      </div>
    </div>
  );
}

export default Gold;
