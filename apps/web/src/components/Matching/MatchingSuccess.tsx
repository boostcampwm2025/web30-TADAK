import { Check } from 'lucide-react';
import { memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import TierBadge from '@/components/Common/TierBadge';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

import MatchingCountdown from './MatchingCountdown';

function MatchingSuccess() {
  const navigate = useNavigate();
  const matchResult = useMatchingStore((state) => state.matchResult);
  const user = useUserStore((state) => state.user);

  // 매칭 성공 시 BattlePage와 에디터 prefetch
  useEffect(() => {
    void import('@/pages/BattlePage');
    void import('@/components/Common/BaseCodeEditor');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    const { setAllowNavigation } = useMatchingStore.getState();
    const currentMatchResult = useMatchingStore.getState().matchResult;

    if (currentMatchResult?.roomId) {
      setAllowNavigation(true);
      navigate(`/room/${currentMatchResult.roomId}`, { replace: true });
    }
  }, [navigate]);

  if (!matchResult || !user) {
    return null;
  }

  const { opponent, myRate } = matchResult;
  const myTier = user.tier;

  return (
    <div className="flex gap-4 w-full flex-col items-center justify-center select-none">
      {/* 매칭 성공 메시지 */}
      <div className="text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-05">
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-4xl font-bold mt-6">매칭 성공!</h1>
        <p className="mt-2 text-lg text-base-primary">2명의 플레이어가 모였습니다</p>
      </div>

      <div className="flex items-center justify-center gap-24 w-2/3 max-w-4xl mx-auto bg-base-faint rounded-3xl py-10">
        {/* 내 정보 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full">
            <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold">{user.username}</p>
            <div className="mt-2">
              <TierBadge tier={myTier.tier} division={myTier.division} />
            </div>
            <p className="mt-1 text-base text-base-secondary">승률: {myRate.winRate.toFixed(0)}%</p>
          </div>
        </div>

        <div className="text-4xl font-black text-green-05 drop-shadow-lg">VS</div>

        {/* 상대방 정보 */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full">
            <img
              src={opponent.avatarUrl}
              alt={opponent.username}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold">{opponent.username}</p>
            <div className="mt-2">
              <TierBadge tier={opponent.tier.tier} division={opponent.tier.division} />
            </div>
            <p className="mt-1 text-base text-base-secondary">
              승률: {opponent.rate.winRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* 카운트다운 */}
      <MatchingCountdown onComplete={handleCountdownComplete} />
    </div>
  );
}

export default memo(MatchingSuccess);
