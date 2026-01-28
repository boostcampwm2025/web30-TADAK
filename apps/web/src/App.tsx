import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useUserStore } from '@/stores/userStore';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const fetchUser = useUserStore((state) => state.fetchUser);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      fetchUser();
    }
  }, [fetchUser]);

  // 활성 배틀이 있는 경우 강제 리다이렉트
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

  return (
    <>
      <Outlet />
    </>
  );
}

export default App;
