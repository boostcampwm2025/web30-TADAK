import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';

import App from '@/App.tsx';
import BattleGuard from '@/components/Guards/BattleGuard.tsx';
import BattlePage from '@/pages/BattlePage.tsx';
import LoginErrorPage from '@/pages/Error/LoginErrorPage';
import LandingPage from '@/pages/LandingPage.tsx';
import LoginPage from '@/pages/LoginPage.tsx';
import MainPage from '@/pages/MainPage.tsx';
import MatchingPage from '@/pages/MatchingPage.tsx';
import MyPage from '@/pages/MyPage.tsx';
import ResultPage from '@/pages/ResultPage.tsx';

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
    <RouterProvider router={router} />
  </StrictMode>,
);
