import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

function MatchingCancelButton() {
  const navigate = useNavigate();

  const handleCancel = async () => {
    const { cancelMatching, unregisterMatchingListeners, setAllowNavigation } =
      useMatchingStore.getState();
    const user = useUserStore.getState().user;
    const socket = useBattleSocketStore.getState().socket;

    if (!user?.id || !socket) return;

    try {
      unregisterMatchingListeners(socket);
      await cancelMatching(user.id);
      setAllowNavigation(true);
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

const MatchingCancelButtonMemo = memo(MatchingCancelButton);
export { MatchingCancelButtonMemo as MatchingCancelButton };
