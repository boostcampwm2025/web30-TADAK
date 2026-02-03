import { domAnimation, LazyMotion } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useUserStore } from '@/stores/userStore';

const BackgroundMusic = lazy(() => import('@/components/Common/BackgroundMusic'));

function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <LazyMotion features={domAnimation}>
      <Suspense fallback={null}>
        <BackgroundMusic />
      </Suspense>
      <Outlet />
    </LazyMotion>
  );
}

export default App;
