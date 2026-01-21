import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);

  // onClose 참조를 항상 최신으로 유지
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // 마운트 직후 애니메이션 트리거
    const animationFrame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // duration 후 사라지기 시작
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    // 페이드 아웃 애니메이션 후 완전히 제거
    const removeTimer = setTimeout(() => {
      onCloseRef.current();
    }, duration + 300);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center gap-3 rounded-lg border-2 border-pink-05 bg-pink-05/10 backdrop-blur-sm px-4 py-3 shadow-lg">
        <AlertCircle className="h-5 w-5 text-pink-05" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
