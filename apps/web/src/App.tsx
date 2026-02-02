import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import BackgroundMusic from '@/components/Common/BackgroundMusic';
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
      <BackgroundMusic />
      <Outlet />
    </>
  );
}

export default App;
