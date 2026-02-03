import Toast from '@/components/Common/Toast';
import { useBattleToastStore } from '@/stores/battleToastStore';

export default function BattleSystemToast() {
  const message = useBattleToastStore((state) => state.message);
  const clear = useBattleToastStore((state) => state.clear);

  if (!message) return null;

  return <Toast message={message} onClose={clear} />;
}
