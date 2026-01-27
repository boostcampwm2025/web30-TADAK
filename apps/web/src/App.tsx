import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useUserStore } from '@/stores/userStore';

function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <>
      <Outlet />
    </>
  );
}

export default App;
