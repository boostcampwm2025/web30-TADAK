import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/Header/Header';
import Modal from '@/components/ui/Modal';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

function MainPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const connect = useBattleSocketStore((state) => state.connect);
  const startMatching = useMatchingStore((state) => state.startMatching);
  const registerMatchingListeners = useMatchingStore((state) => state.registerMatchingListeners);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleStartBattle = async () => {
    if (!user?.id) {
      setShowLoginModal(true);
      return;
    }

    try {
      const socket = connect();

      // Socket이 연결될 때까지 대기
      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          socket.once('connect', () => resolve());
        });
      }

      if (!socket.id) {
        throw new Error('Socket ID를 받지 못했습니다.');
      }

      registerMatchingListeners(socket);

      await startMatching(user.id, socket.id);

      navigate('/matching');
    } catch (error) {
      console.error('매칭 시작 중 오류:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 pt-10 px-10 pb-16">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-01" />
            <h1 className="text-3xl font-bold">LIVE</h1>
            <h1 className="text-3xl font-bold text-brand">BATTLE</h1>
            <button
              type="button"
              onClick={handleStartBattle}
              className="ml-auto rounded-24 bg-brand px-8 py-4 text-lg font-semibold shadow-md transition hover:scale-[1.02]"
            >
              자동 매칭
            </button>
          </div>
          <p className="text-sm text-base-primary">
            현재 진행 중인 배틀을 관전하고 고수들의 코딩을 배워보세요
          </p>
        </div>
      </main>

      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        icon={LogIn}
        title="로그인이 필요합니다"
        description="배틀을 시작하려면 로그인이 필요합니다"
        buttons={[
          {
            label: '취소',
            onClick: () => setShowLoginModal(false),
            variant: 'muted',
          },
          {
            label: '로그인하기',
            onClick: () => navigate('/login'),
            variant: 'green',
          },
        ]}
      />
    </div>
  );
}

export default MainPage;
