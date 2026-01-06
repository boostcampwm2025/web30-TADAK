import { useEffect, useState } from 'react';

import MatchingWait from '@/components/Matching/MatchingWait';

function MatchingPage() {
  const [waitTime, setWaitTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <MatchingWait waitTime={waitTime} />
    </div>
  );
}

export default MatchingPage;
