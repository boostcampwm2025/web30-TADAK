import { ArrowDown, ArrowUp } from 'lucide-react';

import TierBadge from '@/components/ui/TierBadge';

interface PlayerCardProps {
  player: {
    username: string;
    avatarUrl: string;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Ruby' | 'Master';
    rate: number;
    score: number;
    totalScore: number;
    time: string;
  };
  rank: number;
  isWinner: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function PlayerCard({ player, isWinner, isSelected, onClick }: PlayerCardProps) {
  const { username, avatarUrl, tier, rate, score, totalScore, time } = player;
  const scoreChange = isWinner ? 25 : -25;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl bg-bg-layer-2 py-5 px-8 shadow-lg transition pointer hover:shadow-xl cursor-pointer ${
        isSelected
          ? `border-2 ${isWinner ? 'border-green-05' : 'border-pink-05'}`
          : 'border border-border-soft'
      }`}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-green-05">
          <img src={avatarUrl} alt={username} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base-primary text-left">{username}</h3>
          <TierBadge tier={tier} />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-base-primary">{rate}</div>
          <div className="text-xs text-base-secondary">RATE</div>
        </div>
      </div>

      <div className="flex rounded-2xl bg-bg-layer-1/20 border border-border-soft p-2.5">
        <div className="flex flex-6 justify-center items-center gap-3">
          <div className={`rounded-full p-2 ${isWinner ? 'bg-green-01' : 'bg-pink-01'}`}>
            {isWinner ? (
              <ArrowUp className="h-5 w-5 text-green-06" />
            ) : (
              <ArrowDown className="h-5 w-5 text-pink-05" />
            )}
          </div>
          <div>
            <div className={`text-3xl font-bold ${isWinner ? 'text-green-05' : 'text-pink-05'}`}>
              {scoreChange > 0 ? '+' : ''}
              {scoreChange}
            </div>
            <div className="text-sm font-semibold text-base-secondary">랭크 변동</div>
          </div>
        </div>

        <div className="flex flex-4 flex-col gap-1">
          <div className="flex flex-col">
            <span className="text-sm text-base-secondary">SCORE</span>
            <span className="font-semibold text-base-primary">
              {score}/{totalScore}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-base-secondary">TIME</span>
            <span className="font-semibold text-base-primary">{time}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default PlayerCard;
