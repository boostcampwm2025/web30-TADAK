import { useEffect, useRef, useState } from 'react';

import { playBattleCountdownSound } from '@/lib/sound';

interface MatchingCountdownProps {
  onComplete: () => void;
}

export default function MatchingCountdown({ onComplete }: MatchingCountdownProps) {
  const [countdown, setCountdown] = useState(5);
  const hasPlayedReadyRef = useRef(false);
  const hasPlayedStartRef = useRef(false);

  // 효과음 재생 로직
  useEffect(() => {
    if (countdown === 5 && !hasPlayedReadyRef.current) {
      hasPlayedReadyRef.current = true;
      playBattleCountdownSound('tick');
    }
    if (countdown === 0 && !hasPlayedStartRef.current) {
      hasPlayedStartRef.current = true;
      playBattleCountdownSound('end');
    }
  }, [countdown]);

  // 카운트다운 타이머 로직
  useEffect(() => {
    if (countdown === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className="text-center">
      {countdown > 0 ? (
        <div className="text-9xl font-black text-green-05">{countdown}</div>
      ) : (
        <div className="text-9xl font-black italic text-green-05 animate-bounce">FIGHT!</div>
      )}
    </div>
  );
}
