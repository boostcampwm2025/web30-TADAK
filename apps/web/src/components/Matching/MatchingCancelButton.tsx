import { useNavigate } from 'react-router-dom';

import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

export function MatchingCancelButton() {
  const navigate = useNavigate();
  const { cancelMatching, unregisterMatchingListeners, cleanup } = useMatchingStore();
  const user = useUserStore((state) => state.user);
  const socket = useBattleSocketStore((state) => state.socket);

  const handleCancel = async () => {
    if (!user?.id || !socket) return;

    try {
      unregisterMatchingListeners(socket);
      await cancelMatching(user.id);
      cleanup();
      navigate('/');
    } catch (error) {
      console.error('매칭 취소 실패:', error);
    }
  };

  return (
    <button
      onClick={handleCancel}
      className="flex items-center rounded-24 bg-base-muted px-4 py-2 font-bold transition hover:bg-base-tertiary active:scale-95"
    >
      매칭 취소
    </button>
  );
}
