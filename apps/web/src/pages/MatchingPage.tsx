import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MatchingWait from '@/components/Matching/MatchingWait';
import WaitConfirmModal from '@/components/Matching/MatchingWaitModal';

function MatchingPage() {
  const navigate = useNavigate();
  const [waitTime, setWaitTime] = useState(0);
  const [showModal, setShowModal] = useState(false);

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

  const handleContinue = () => {
    setShowModal(false);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <MatchingWait waitTime={waitTime} />
      {showModal && <WaitConfirmModal onContinue={handleContinue} onCancel={handleCancel} />}
    </div>
  );
}

export default MatchingPage;
