import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useUserStore } from '@/stores/userStore';

interface BattleGuardProps {
  children: React.ReactNode;
}

// 활성 배틀이 있는 유저를 해당 배틀 페이지로 리다이렉트
function BattleGuard({ children }: BattleGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (user?.currentRoomId) {
      const currentPath = location.pathname;
      const targetPath = `/room/${user.currentRoomId}`;

      // 현재 경로가 타겟 경로와 다르고, 결과 페이지가 아닐 때만 이동
      if (currentPath !== targetPath && !currentPath.startsWith('/result')) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [user?.currentRoomId, location.pathname, navigate]);

  return <>{children}</>;
}

export default BattleGuard;
