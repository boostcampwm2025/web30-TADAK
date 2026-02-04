import { useEffect, useState } from 'react';

export default function MatchingTimer() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className="flex items-center justify-center gap-2 rounded-3xl bg-base-muted px-5 py-2 text-base-secondary">
      <span className="w-2 h-2 bg-red-500 rounded-full" />
      <span>대기 시간:</span>
      {minutes > 0 ? (
        <span className="inline-flex items-center gap-0.5">
          <span className="w-5 text-right">{minutes}</span>
          <span>분</span>
          <span className="w-5 text-right">{seconds.toString().padStart(2, '0')}</span>
          <span>초</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-0.5">
          <span className="w-5 text-right">{seconds}</span>
          <span>초</span>
        </span>
      )}
    </div>
  );
}
