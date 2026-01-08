import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

export function MatchingCancelButton() {
  const cancelMatching = useMatchingStore((state) => state.cancelMatching);
  const user = useUserStore((state) => state.user);

  const handleCancel = async () => {
    if (!user) return;

    try {
      await cancelMatching(user.id);
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
