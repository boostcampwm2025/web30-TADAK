import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

export default function MatchingSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const matchResult = useMatchingStore((state) => state.matchResult);
  const user = useUserStore((state) => state.user);

  // 카운트다운 로직
  useEffect(() => {
    if (countdown === 0) {
      if (matchResult?.roomId) {
        navigate(`/room/${matchResult.roomId}`);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, matchResult, navigate]);

  if (!matchResult || !user) {
    return null;
  }

  const { opponent, myRate } = matchResult;

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
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span>🏆</span>
              <span className="font-semibold text-base-secondary capitalize">GOLD</span>
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
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span>🏆</span>
              <span className="font-semibold text-base-secondary capitalize">
                {opponent.tier.tier}
                {opponent.tier.division ? ` ${opponent.tier.division}` : ''}
              </span>
            </div>
            <p className="mt-1 text-base text-base-secondary">
              승률: {opponent.rate.winRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* 카운트다운 */}
      <div className="text-center">
        {countdown > 0 ? (
          <div className="text-9xl font-black text-green-05">{countdown}</div>
        ) : (
          <div className="text-9xl font-black italic text-green-05 animate-bounce">FIGHT!</div>
        )}
      </div>
    </div>
  );
}
