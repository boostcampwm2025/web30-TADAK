import { useEffect, useMemo, useRef, useState } from 'react';

import BattleProblem from '@/components/Battle/BattleProblem';
import ChatSpectator from '@/components/Battle/Spectator/ChatSpectator';
import CodeSpectator from '@/components/Battle/Spectator/CodeSpectator';

function BattleSpectator() {
  const [showProblem, setShowProblem] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const gridCols =
    'grid grid-cols-1 gap-4 xl:flex-1 xl:min-h-0 xl:grid-cols-[minmax(320px,1.1fr)_minmax(520px,1.9fr)_minmax(280px,1fr)]';

  const codeSpanClass = useMemo(() => {
    if (!showProblem && !showChat) return 'xl:col-span-3';
    if (!showProblem || !showChat) return 'xl:col-span-2';
    return '';
  }, [showProblem, showChat]);

  useEffect(() => {
    if (showChat) {
      // 채팅 패널이 다시 나타날 때 뷰로 스크롤
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showChat]);

  return (
    <>
      <div className="flex flex-col gap-2 xl:h-full xl:min-h-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-base-primary md:mb-3">
          <button
            type="button"
            onClick={() => setShowProblem((prev) => !prev)}
            className="rounded-lg bg-base-faint px-3 py-1 transition hover:bg-base-tertiary"
          >
            {showProblem ? '문제 숨기기' : '문제 보기'}
          </button>
          <button
            type="button"
            onClick={() => setShowChat((prev) => !prev)}
            className="rounded-lg bg-base-faint px-3 py-1 transition hover:bg-base-tertiary"
          >
            {showChat ? '채팅 숨기기' : '채팅 보기'}
          </button>
        </div>
        <div className={`${gridCols}`}>
          {showProblem && (
            <div className="fade-slide-in xl:h-full xl:min-h-0 chat-scroll">
              <BattleProblem />
            </div>
          )}
          <div className={`fade-slide-in xl:h-full xl:min-h-0 ${codeSpanClass}`}>
            <CodeSpectator />
          </div>
          <div
            ref={chatRef}
            className={`fade-slide-in xl:h-full xl:min-h-0 ${showChat ? '' : 'hidden'}`}
          >
            <ChatSpectator />
          </div>
        </div>
      </div>
    </>
  );
}

export default BattleSpectator;
