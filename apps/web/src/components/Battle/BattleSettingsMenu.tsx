import { Moon, Settings, Sun, Volume2, VolumeX } from 'lucide-react';
import { memo, useCallback, useRef, useState } from 'react';

import { playPreviewSound } from '@/lib/sound';
import { useSoundStore } from '@/stores/soundStore';

type BattleSettingsMenuProps = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

function BattleSettingsMenu({ theme, toggleTheme }: BattleSettingsMenuProps) {
  const {
    volume,
    isMuted,
    setVolume,
    toggleMute,
    bgmVolume,
    isBgmMuted,
    setBgmVolume,
    toggleBgmMute,
  } = useSoundStore();
  const isBgmSilent = isBgmMuted || bgmVolume <= 0;
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const settingRef = useRef<HTMLDivElement>(null);

  const handleToggleSetting = useCallback(() => {
    setIsSettingOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative" ref={settingRef}>
      <button
        onClick={handleToggleSetting}
        className="rounded-full bg-base-faint p-2 text-ink shadow-sm transition hover:scale-110 active:scale-95"
      >
        <Settings size={24} className="text-slate-400" />
      </button>
      {isSettingOpen && (
        <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-24 bg-bg-layer-2 p-2 shadow-2xl focus:outline-none transition-all duration-200 ease-out z-[100]">
          <div className="flex flex-col gap-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-24 px-4 py-2 text-sm text-ink transition hover:bg-base-muted"
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
            <div className="px-4 pt-2 text-[11px] font-semibold text-base-secondary">효과음</div>
            <div className="flex items-center gap-3 px-4 py-2">
              <button
                onClick={toggleMute}
                className="text-ink transition hover:text-brand"
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
            <div className="px-4 pt-1 text-[11px] font-semibold text-base-secondary">배경음악</div>
            <div className="flex items-center gap-3 px-4 py-2">
              <button
                onClick={toggleBgmMute}
                className="text-ink transition hover:text-brand"
                aria-label={isBgmSilent ? 'Unmute background music' : 'Mute background music'}
              >
                {isBgmSilent ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-soft accent-brand"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(BattleSettingsMenu);
