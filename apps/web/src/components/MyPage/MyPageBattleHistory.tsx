import type { BattleHistoryItem } from '@shared/types/user';

interface MyPageBattleHistoryProps {
  battles: BattleHistoryItem[];
  onBattleClick: (battleId: string) => void;
}

export function MyPageBattleHistory({ battles, onBattleClick }: MyPageBattleHistoryProps) {
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return '방금 전';
    if (diffInMins < 60) return `${diffInMins}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return `${diffInDays}일 전`;
  };

  return (
    <div id="view-history" className="battle-list flex flex-col gap-4">
      {battles.map((battle) => (
        <div
          key={battle.id}
          className="battle-card bg-bg-layer-2 border border-border-soft rounded-24 p-6 grid grid-cols-[auto_1fr_auto] items-center gap-8"
          onClick={() => onBattleClick(battle.id)}
        >
          <div
            className={`res-label w-16 h-16 rounded-[18px] flex items-center justify-center font-black text-sm text-white ${
              battle.result === 'WIN'
                ? 'bg-brand'
                : battle.result === 'LOSS'
                  ? 'bg-red-01'
                  : 'bg-base-tertiary'
            }`}
          >
            {battle.result}
          </div>
          <div className="b-info">
            <h4 className="text-lg font-extrabold mb-1">{battle.problem.title}</h4>
            <div className="b-meta text-sm text-base-secondary flex items-center gap-2">
              vs <span className="b-opponent font-bold text-ink">{battle.opponentName}</span> ·{' '}
              {battle.submission
                ? `${battle.submission.passedTestCases}/${battle.submission.totalTestCases} 테스트 통과`
                : '제출 기록 없음'}
            </div>
          </div>
          <div className="lp-box text-right">
            <div
              className={`lp-val text-xl font-black ${battle.ratingChange > 0 ? 'text-brand' : 'text-red-01'}`}
            >
              {battle.ratingChange > 0 ? '+' : ''}
              {battle.ratingChange} Rating
            </div>
            <div className="b-time text-[11px] text-base-tertiary font-semibold">
              {formatTimeAgo(battle.createdAt)}
            </div>
          </div>
        </div>
      ))}
      {battles.length === 0 && (
        <div className="py-20 text-center text-base-tertiary font-medium">
          아직 배틀 기록이 없습니다.
        </div>
      )}
    </div>
  );
}
