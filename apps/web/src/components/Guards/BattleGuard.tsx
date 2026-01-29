import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@/stores/userStore';

interface BattleGuardProps {
  children: React.ReactNode;
}

// 배틀 중인 유저를 해당 배틀 페이지로 리다이렉트
function BattleGuard({ children }: BattleGuardProps) {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const isLeavingRoom = useUserStore((state) => state.isLeavingRoom);

  useEffect(() => {
    // 배틀 중이고 이탈 중이 아닐 때만 리다이렉트
    if (user?.currentRoomId && !isLeavingRoom) {
      navigate(`/room/${user.currentRoomId}`, { replace: true });
    }
  }, [user?.currentRoomId, isLeavingRoom, navigate]);

  // 리다이렉트 전 깜빡임 방지
  if (user?.currentRoomId && !isLeavingRoom) {
    return null;
  }

  return <>{children}</>;
}

export default BattleGuard;
