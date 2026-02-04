import { memo } from 'react';

import { useMatchingStore } from '@/stores/matchingStore';

import LoadingSpinner from './LoadingSpinner';
import MatchingStats from './MatchingStats';
import MatchingTimer from './MatchingTimer';

function MatchingWait() {
  const timeoutMessage = useMatchingStore((state) => state.timeoutMessage);
  return (
    <div className="max-w-4xl mx-auto select-none">
      <div className="flex flex-col bg-base-faint rounded-3xl shadow-lg p-16 gap-8">
        {/* 로딩 스피너 */}
        <LoadingSpinner />

        {/* 매칭 상태 메시지 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-center">상대를 찾는 중...</h1>
          <p className="text-base-primary font-bold text-center">
            티어에서 비슷한 실력의 상대를 매칭하고 있습니다
          </p>
          <p className="text-base-primary font-bold text-center">
            매칭을 끊었다가 재매칭하면 대기의 후순위로 밀려납니다
          </p>
        </div>

        {/* 대기 시간 */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-center gap-2">
            <MatchingTimer />
            <div className="min-h-6">
              {timeoutMessage && <p className="text-sm">{timeoutMessage}</p>}
            </div>
          </div>

          {/* 통계 카드 */}
          <MatchingStats />
        </div>
      </div>
    </div>
  );
}

export default memo(MatchingWait);
