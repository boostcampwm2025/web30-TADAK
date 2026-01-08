import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from '@/App.tsx';
import BattlePage from '@/pages/BattlePage.tsx';
import LoginErrorPage from '@/pages/Error/LoginErrorPage';
import LoginPage from '@/pages/LoginPage.tsx';
import MainPage from '@/pages/MainPage.tsx';
import MatchingPage from '@/pages/MatchingPage.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
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
