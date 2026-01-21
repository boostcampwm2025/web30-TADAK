import { useEffect, useState } from 'react';

import Toast from '@/components/Common/Toast';
import Header from '@/components/Header/Header';
import { MatchingCancelButton } from '@/components/Matching/MatchingCancelButton';
import MatchingSuccess from '@/components/Matching/MatchingSuccess';
import MatchingWait from '@/components/Matching/MatchingWait';
import { useMatchingStore } from '@/stores/matchingStore';

function MatchingPage() {
  const [waitTime, setWaitTime] = useState(0);
  const matchResult = useMatchingStore((state) => state.matchResult);
  const toastMessage = useMatchingStore((state) => state.toastMessage);
  const clearToast = useMatchingStore((state) => state.clearToast);

  // 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 페이지 이탈(뒤로가기 등) 시 cleanup
  useEffect(() => {
    return () => {
      const currentMatchResult = useMatchingStore.getState().matchResult;
      if (!currentMatchResult) {
        useMatchingStore.getState().cleanup();
      }
    };
  }, []);

  if (matchResult) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header hideUserMenu />
        <div className="flex flex-1 items-center justify-center">
          <MatchingSuccess />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header rightContent={<MatchingCancelButton />} />
      <div className="flex flex-1 items-center justify-center">
        <MatchingWait waitTime={waitTime} />
      </div>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => {
            clearToast();
          }}
        />
      )}
    </div>
  );
}

export default MatchingPage;
