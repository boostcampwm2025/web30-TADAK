import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MatchingSuccess from '@/components/Matching/MatchingSuccess';
import MatchingWait from '@/components/Matching/MatchingWait';
import WaitConfirmModal from '@/components/Matching/MatchingWaitModal';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

function MatchingPage() {
  const navigate = useNavigate();
  const [waitTime, setWaitTime] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const user = useUserStore((state) => state.user);
  const socket = useBattleSocketStore((state) => state.socket);
  const matchResult = useMatchingStore((state) => state.matchResult);
  const cancelMatching = useMatchingStore((state) => state.cancelMatching);
  const cleanup = useMatchingStore((state) => state.cleanup);

  // 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime((prev) => {
        if ((prev + 1) % 60 === 0) setShowModal(true);
        return prev + 1;
      });
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

  const handleContinue = () => {
    setShowModal(false);
  };

  const handleCancel = async () => {
    if (user?.id && socket) {
      try {
        socket.off('match-success');

        await cancelMatching(user.id);
      } catch (error) {
        console.error('매칭 취소 중 오류:', error);
      }
    }

    cleanup();
    navigate('/');
  };

  if (matchResult) {
    return <MatchingSuccess />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <MatchingWait waitTime={waitTime} />
      {showModal && <WaitConfirmModal onContinue={handleContinue} onCancel={handleCancel} />}
    </div>
  );
}

export default MatchingPage;
