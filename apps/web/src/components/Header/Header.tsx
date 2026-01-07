import { LogOut, Moon, Settings, Sun, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { logout } from '@/apis/auth';
import { UserProfile } from '@/components/Profile/UserProfile';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/stores/userStore';

function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, fetchUser, clearUser } = useUserStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn, fetchUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    clearUser();
    setIsMenuOpen(false);
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
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center transition hover:opacity-80 active:scale-95"
              >
                <UserProfile username={user.username} tier="Gold" avatarUrl={user.avatarUrl} />
              </button>

              {isMenuOpen && (
                <div className="absolute mt-3 w-48 origin-top-right rounded-24 bg-bg-layer-2 p-2 shadow-2xl focus:outline-none transition-all duration-200 ease-out z-50">
                  <div className="flex flex-col gap-1">
                    <button className="flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-ink transition hover:bg-base-muted">
                      <UserIcon size={18} className="text-slate-400" />
                      마이페이지
                    </button>
                    <button className="flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-ink transition hover:bg-base-muted">
                      <Settings size={18} className="text-slate-400" />
                      설정
                    </button>
                    <div className="my-1 h-[1px] bg-border-soft" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
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
