import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MatchingSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // 카운트다운 로직
  useEffect(() => {
    if (countdown === 0) {
      // TODO: 실제 roomId로 변경 필요
      navigate('/room/test-room');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 select-none">
      {/* 매칭 성공 메시지 */}
      <div className="text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-05">
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-4xl font-bold mt-6">매칭 성공!</h1>
        <p className="mt-2 text-lg text-base-primary">2명의 플레이어가 모였습니다</p>
      </div>

      {/* VS 카드 */}
      <div className="flex items-center justify-center gap-24 w-2/3 max-w-6xl mx-auto bg-base-faint rounded-3xl py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-4xl font-bold text-white">
            Y
          </div>
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold">You</p>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span>🏆</span>
              <span className="font-semibold text-base-secondary">Gold</span>
            </div>
            <p className="mt-1 text-base text-base-secondary">승률: 72%</p>
          </div>
        </div>

        <div className="text-4xl font-black text-green-05 drop-shadow-lg">VS</div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-4xl font-bold text-white">
            C
          </div>
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold">You</p>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm">
              <span>🏆</span>
              <span className="font-semibold text-base-secondary">Gold</span>
            </div>
            <p className="mt-1 text-base text-base-secondary">승률: 72%</p>
          </div>
        </div>
      </div>

      {/* 카운트다운 */}
      <div className="text-center">
        {countdown > 0 ? (
          <div className="text-9xl font-black text-green-05">{countdown}</div>
        ) : (
          <div className="text-9xl font-black italic text-green-05 animate-bounce">FIGHT!</div>
        )}
      </div>
    </div>
  );
}
