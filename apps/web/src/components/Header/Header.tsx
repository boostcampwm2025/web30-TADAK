import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { logout } from '@/apis/auth';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/userStore';

import { UserProfile } from '../Profile/UserProfile';

function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, fetchUser, clearUser } = useUserStore();
  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn, fetchUser]);

  const handleLogout = () => {
    logout();
    clearUser();
  };

  return (
    <header className="border-b border-border-soft bg-bg-layer-2 shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-10 py-2">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 rounded-2xl bg-brand shadow-lg"></div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight logo-gradient">CODE RENA</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn && user ? (
            <div className="flex items-center gap-4">
              <UserProfile username={user.username} tier="Gold" avatarUrl={user.avatarUrl} />
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition"
              >
                로그아웃
              </button>
            </div>
          ) : !isLoggedIn ? (
            <Link
              to="/login"
              className="rounded-24 bg-base-muted px-4 py-2 text-base font-medium text-ink shadow-sm transition hover:scale-105 active:scale-95"
            >
              로그인
            </Link>
          ) : null}
          <button
            onClick={toggleTheme}
            className="rounded-full bg-base-muted p-2 text-ink shadow-sm transition hover:scale-110 active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
