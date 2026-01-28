import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import BattleGuard from '@/components/Guards/BattleGuard';
import { useUserStore } from '@/stores/userStore';

function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <BattleGuard>
      <Outlet />
    </BattleGuard>
  );
}

export default App;
