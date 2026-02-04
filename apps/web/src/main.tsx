import './index.css';

import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';

import App from '@/App.tsx';
import BattleGuard from '@/components/Guards/BattleGuard.tsx';
import LoginErrorPage from '@/pages/Error/LoginErrorPage';
import LoginPage from '@/pages/LoginPage.tsx';
import MainPage from '@/pages/MainPage.tsx';

// 코드 스플리팅
const BattlePage = lazy(() => import('@/pages/BattlePage.tsx'));
const MatchingPage = lazy(() => import('@/pages/MatchingPage.tsx'));
const ResultPage = lazy(() => import('@/pages/ResultPage.tsx'));
const MyPage = lazy(() => import('@/pages/MyPage.tsx'));
const LandingPage = lazy(() => import('@/pages/LandingPage.tsx'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: (
          <BattleGuard>
            <Outlet />
          </BattleGuard>
        ),
        children: [
          {
            index: true,
            element: <MainPage />,
          },
          {
            path: '/matching',
            element: <MatchingPage />,
          },
        ],
      },
      {
        path: '/landing',
        element: <LandingPage />,
      },
      {
        path: '/matching',
        element: <MatchingPage />,
      },
      {
        path: '/room/:roomId',
        element: <BattlePage />,
      },
      {
        path: '/result/:battleId',
        element: <ResultPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/mypage',
        element: <MyPage />,
      },
      {
        path: '/error',
        element: <LoginErrorPage />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
);
