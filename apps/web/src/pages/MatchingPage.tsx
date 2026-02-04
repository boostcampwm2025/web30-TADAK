import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';

import Modal from '@/components/Common/Modal';
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
  const [showCancelModal, setShowCancelModal] = useState(false);
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
  const blocker = useBlocker(() => !useMatchingStore.getState().allowNavigation);

  // 토큰 존재 여부 확인
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  const cancelButton = useMemo(() => <MatchingCancelButton />, []);

  // 페이지 진입 시 allowNavigation 초기화
  useEffect(() => {
    useMatchingStore.getState().setAllowNavigation(false);
  }, []);

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
    if (blocker.state === 'blocked') {
      setShowCancelModal(true);
    }
  }, [blocker]);

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    const { matchResult, cancelMatching, cleanup } = useMatchingStore.getState();
    const user = useUserStore.getState().user;

    if (matchResult) {
      cleanup();
    } else if (user?.id) {
      cancelMatching(user.id);
    }

    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleCancelModal = () => {
    setShowCancelModal(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

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

  const cancelModal = (
    <Modal
      isOpen={showCancelModal}
      title="매칭 취소"
      description={
        matchResult ? '매칭이 완료되었습니다. 취소하시겠습니까?' : '매칭을 취소하고 나가시겠습니까?'
      }
      closeOnBackdrop={false}
      buttons={[
        {
          label: '취소',
          onClick: handleCancelModal,
          variant: 'muted',
        },
        {
          label: '확인',
          onClick: handleConfirmCancel,
          variant: 'green',
        },
      ]}
    />
  );

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
        {cancelModal}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header rightContent={cancelButton} />
      <div className="flex flex-1 items-center justify-center">
        <MatchingWait />
      </div>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => {
            clearToast();
          }}
        />
      )}
      {cancelModal}
    </div>
  );
}

export default MatchingPage;
