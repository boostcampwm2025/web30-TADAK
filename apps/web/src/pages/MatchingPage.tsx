import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Toast from '@/components/Common/Toast';
import Header from '@/components/Header/Header';
import { MatchingCancelButton } from '@/components/Matching/MatchingCancelButton';
import MatchingSuccess from '@/components/Matching/MatchingSuccess';
import MatchingWait from '@/components/Matching/MatchingWait';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

function MatchingPage() {
  const navigate = useNavigate();
  const [waitTime, setWaitTime] = useState(0);
  const isMatchingStartedRef = useRef(false);
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const connect = useBattleSocketStore((state) => state.connect);
  const matchResult = useMatchingStore((state) => state.matchResult);
  const toastMessage = useMatchingStore((state) => state.toastMessage);
  const clearToast = useMatchingStore((state) => state.clearToast);
  const startMatching = useMatchingStore((state) => state.startMatching);
  const registerMatchingListeners = useMatchingStore((state) => state.registerMatchingListeners);

  // 토큰 존재 여부 확인
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  // 유저 정보 로드 (토큰 있을 때만)
  useEffect(() => {
    if (hasToken && !user && !isLoading) {
      fetchUser();
    }
  }, [hasToken, user, isLoading, fetchUser]);

  // 페이지 진입 시 매칭 시작
  useEffect(() => {
    if (!hasToken) {
      navigate('/login');
      return;
    }

    // 토큰 있으면 유저 로딩 완료 대기
    if (isLoading || !user?.id) return;

    // 이미 매칭 시작했으면 중복 실행 방지
    if (isMatchingStartedRef.current) return;
    isMatchingStartedRef.current = true;

    const socket = connect();

    const start = () => {
      registerMatchingListeners(socket);
      startMatching(user.id, socket.id!);
    };

    if (!socket.id) {
      socket.once('connect', start);
    } else {
      start();
    }

    return () => {
      isMatchingStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, user?.id, isLoading]);

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
      const { matchResult, cancelMatching, cleanup } = useMatchingStore.getState();
      const user = useUserStore.getState().user;

      if (!matchResult && user?.id) {
        cancelMatching(user.id);
      } else {
        cleanup();
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const { matchResult } = useMatchingStore.getState();
      const user = useUserStore.getState().user;

      if (!matchResult && user?.id) {
        navigator.sendBeacon('/api/matching/cancel', JSON.stringify({ userId: user.id }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (hasToken && (isLoading || !user)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-lg text-base-secondary">로딩 중...</div>
        </div>
      </div>
    );
  }

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
