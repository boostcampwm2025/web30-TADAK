import { useEffect, useMemo, useRef, useState } from 'react';

import BattleProblem from '@/components/Battle/BattleProblem';
import BattleProgress from '@/components/Battle/Player/BattleSituation';
import CodeEditor from '@/components/Battle/Player/CodeEditor';
import ProgressBar from '@/components/Battle/Player/ProgressBar';

function BattlePlayer() {
  const [showProblem, setShowProblem] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const progressRef = useRef<HTMLDivElement>(null);

  const gridCols = useMemo(() => {
    return 'grid grid-cols-1 gap-4 xl:flex-1 xl:min-h-0 xl:grid-cols-[minmax(320px,1.2fr)_minmax(520px,2fr)_minmax(280px,1fr)]';
  }, [showProblem, showProgress]);

  const codeSpanClass = useMemo(() => {
    if (!showProblem && !showProgress) return 'xl:col-span-3';
    if (!showProblem || !showProgress) return 'xl:col-span-2';
    return '';
  }, [showProblem, showProgress]);

  useEffect(() => {
    if (showProgress) {
      // 진행 상황 패널이 다시 나타날 때 뷰로 스크롤
      progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showProgress]);

  return (
    <>
      <div className="flex flex-col gap-2 xl:h-full xl:min-h-0">
        <ProgressBar />
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-base-primary md:mb-3">
          <button
            type="button"
            onClick={() => setShowProblem((prev) => !prev)}
            className="rounded-lg  bg-base-faint px-3 py-1 transition hover:bg-base-tertiary"
          >
            {showProblem ? '문제 숨기기' : '문제 보기'}
          </button>
          <button
            type="button"
            onClick={() => setShowProgress((prev) => !prev)}
            className="rounded-lg  bg-base-faint px-3 py-1 transition hover:bg-base-tertiary"
          >
            {showProgress ? '상대 진행 숨기기' : '상대 진행 보기'}
          </button>
        </div>
        <div className={`${gridCols}`}>
          {showProblem && (
            <div className="fade-slide-in xl:h-full xl:min-h-0 chat-scroll">
              <BattleProblem />
            </div>
          )}
          <div className={`fade-slide-in xl:h-full xl:min-h-0 ${codeSpanClass}`}>
            <CodeEditor />
          </div>
          {showProgress && (
            <div ref={progressRef} className="fade-slide-in xl:h-full xl:min-h-0">
              <BattleProgress />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default BattlePlayer;
