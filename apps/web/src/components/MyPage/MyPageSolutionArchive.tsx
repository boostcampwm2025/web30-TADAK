import type { SubmissionHistoryItem } from '@shared/types/user';

interface MyPageSolutionArchiveProps {
  submissions: SubmissionHistoryItem[];
  onSubmissionClick: (submissionId: string) => void;
}

export function MyPageSolutionArchive({
  submissions,
  onSubmissionClick,
}: MyPageSolutionArchiveProps) {
  const groups: Record<string, SubmissionHistoryItem[]> = {};
  submissions.forEach((sub) => {
    if (!groups[sub.difficulty]) groups[sub.difficulty] = [];
    groups[sub.difficulty].push(sub);
  });

  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Unranked'];
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    return tierOrder.indexOf(a) - tierOrder.indexOf(b);
  });

  const getTierTagClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'platinum':
        return 'bg-cyan-50 text-tier-platinum';
      case 'gold':
        return 'bg-yellow-50 text-tier-gold';
      case 'silver':
        return 'bg-slate-100 text-tier-silver';
      case 'bronze':
        return 'bg-orange-50 text-tier-bronze';
      default:
        return 'bg-bg-layer-1 text-base-tertiary';
    }
  };

  return (
    <div id="view-archive" className="archive-section flex flex-col gap-8">
      <div className="archive-header flex justify-between items-center">
        <h2 className="text-2xl font-extrabold">내 풀이 기록</h2>
      </div>

      <div id="archive-content">
        {sortedKeys.map((key) => (
          <div key={key} className="mb-10 last:mb-0">
            <div className="group-label text-sm font-extrabold text-base-tertiary mb-5 flex items-center gap-3">
              {key} 등급 문제
              <div className="flex-1 h-[1px] bg-border-soft" />
            </div>
            <div className="problem-grid grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
              {groups[key].map((p) => (
                <div
                  key={p.id}
                  className="problem-card bg-bg-layer-2 border border-border-soft rounded-[20px] p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-brand"
                >
                  <div className="p-tag-wrap flex justify-between items-center">
                    <span
                      className={`p-tier-tag text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md ${getTierTagClass(p.difficulty)}`}
                    >
                      {p.difficulty}
                    </span>
                    <span className="p-date text-xs text-base-tertiary font-semibold">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-[17px] font-extrabold leading-[1.4] min-h-[3em]">
                    {p.problemTitle}
                  </h4>
                  <button
                    className="cursor-pointer btn-solution mt-auto p-2.5 bg-bg-layer-1 border-none rounded-xl font-bold text-xs text-base-secondary transition-all hover:bg-brand hover:text-white"
                    onClick={() => onSubmissionClick(p.id)}
                  >
                    풀이 보기
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="py-20 text-center text-base-tertiary font-medium">
            해결한 문제가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
