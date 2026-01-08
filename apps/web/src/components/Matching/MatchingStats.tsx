import { useMatchingStore } from '@/stores/matchingStore';

import StatCard from './StatCard';

export default function MatchingStats() {
  const stats = useMatchingStore((state) => state.stats);

  const waitingPlayers = stats?.waitingPlayers ?? 0;
  const ongoingBattles = stats?.ongoingBattles ?? 0;
  const avgMatchTime = stats?.avgMatchTime ?? 0;

  return (
    <div className="flex gap-4 mt-8">
      <StatCard value={waitingPlayers} label="대기 중인 플레이어" />
      <StatCard value={ongoingBattles} label="진행 중인 배틀" />
      <StatCard value={`${avgMatchTime}s`} label="평균 매칭 시간" />
    </div>
  );
}
