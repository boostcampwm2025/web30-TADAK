import StatCard from './StatCard';

export default function MatchingStats() {
  return (
    <div className="flex gap-4 mt-8">
      <StatCard value="24" label="대기 중인 플레이어" />
      <StatCard value="8" label="진행 중인 배틀" />
      <StatCard value="10s" label="평균 매칭 시간" />
    </div>
  );
}
