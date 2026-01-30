import { LogOut, Moon, Settings, Sun, User as UserIcon, Volume2, VolumeX } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { logout } from '@/apis/auth';
import LogoImage from '@/assets/logo.png';
import { UserProfile } from '@/components/Profile/UserProfile';
import { useTheme } from '@/hooks/useTheme';
import { playPreviewSound } from '@/lib/sound';
import { useSoundStore } from '@/stores/soundStore';
import { useUserStore } from '@/stores/userStore';

interface HeaderProps {
  hideUserMenu?: boolean;
  rightContent?: ReactNode;
}

function Header({ hideUserMenu = false, rightContent }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { volume, isMuted, setVolume, toggleMute } = useSoundStore();
  const { user, fetchUser, clearUser } = useUserStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingRef = useRef<HTMLDivElement>(null);
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
      if (settingRef.current && !settingRef.current.contains(event.target as Node)) {
        setIsSettingOpen(false);
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
    <header className="relative z-50 border-b border-border-soft bg-bg-layer-2 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-2">
        <Link to="/" className="flex items-center gap-3">
          <img src={LogoImage} alt="TADAK 로고" className="h-12 w-auto" />
          <span className="text-2xl font-black tracking-tight">TADAK</span>
        </Link>
        <div className="flex items-center gap-4">
          {rightContent ? (
            rightContent
          ) : !hideUserMenu ? (
            isLoggedIn && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="cursor-pointer flex items-center transition hover:opacity-80 active:scale-95"
                >
                  <UserProfile
                    username={user.username}
                    tier={user.tier?.tier}
                    division={user.tier?.division}
                    avatarUrl={user.avatarUrl}
                  />
                </button>

                {isMenuOpen && (
                  <div className="absolute mt-3 w-48 origin-top-right rounded-24 bg-bg-layer-2 p-2 shadow-2xl focus:outline-none transition-all duration-200 ease-out z-50">
                    <div className="flex flex-col gap-1">
                      <Link
                        to="/mypage"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-ink transition hover:bg-base-muted"
                      >
                        <UserIcon size={18} className="text-slate-400" />
                        마이페이지
                      </Link>
                      <div className="my-1 h-[1px] bg-border-soft" />
                      <button
                        onClick={handleLogout}
                        className="cursor-pointer flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-24 bg-base-muted px-4 py-2 text-base font-medium text-ink shadow-sm transition hover:scale-105 active:scale-95"
              >
                로그인
              </Link>
            )
          ) : null}
          <div className="relative" ref={settingRef}>
            <button
              onClick={() => setIsSettingOpen(!isSettingOpen)}
              className="cursor-pointer rounded-full bg-base-muted p-2 text-ink shadow-sm transition hover:scale-110 active:scale-95"
            >
              <Settings size={24} className="text-slate-400" />
            </button>
            {isSettingOpen && (
              <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-24 bg-bg-layer-2 p-2 shadow-2xl focus:outline-none transition-all duration-200 ease-out z-[100]">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={toggleTheme}
                    className="cursor-pointer flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-ink transition hover:bg-base-muted"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun size={18} />
                        <span>라이트 모드</span>
                      </>
                    ) : (
                      <>
                        <Moon size={18} />
                        <span>다크 모드</span>
                      </>
                    )}
                  </button>
                  <div className="my-1 h-[1px] bg-border-soft" />
                  <div className="flex items-center gap-3 px-4 py-2">
                    <button
                      onClick={toggleMute}
                      className="cursor-pointer text-ink transition hover:text-brand"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      onMouseUp={playPreviewSound}
                      onTouchEnd={playPreviewSound}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-soft accent-brand"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
