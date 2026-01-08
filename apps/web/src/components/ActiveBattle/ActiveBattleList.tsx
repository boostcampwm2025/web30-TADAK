import type { Battle } from '@shared/types/battle';

import ActiveBattleCard from './ActiveBattleCard';

interface ActiveBattleListProps {
  battles: Battle[];
  onJoinBattle: (roomId: string) => void;
}

export default function ActiveBattleList({ battles, onJoinBattle }: ActiveBattleListProps) {
  if (battles.length === 0) {
    return (
      <div className="text-center py-20 text-base-primary">
        <p className="text-xl">진행 중인 배틀이 없습니다</p>
        <p className="mt-2">자동 매칭으로 새로운 배틀을 시작해보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {battles.map((battle) => (
        <ActiveBattleCard key={battle.battleId} battle={battle} onJoin={onJoinBattle} />
      ))}
    </div>
  );
}
