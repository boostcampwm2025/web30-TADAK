import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundState {
  volume: number;
  isMuted: boolean;
  bgmVolume: number;
  isBgmMuted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setBgmVolume: (volume: number) => void;
  toggleBgmMute: () => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      volume: 0.3,
      isMuted: false,
      bgmVolume: 0.2,
      isBgmMuted: false,
      setVolume: (volume) => set({ volume }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setBgmVolume: (volume) => set({ bgmVolume: volume }),
      toggleBgmMute: () => set((state) => ({ isBgmMuted: !state.isBgmMuted })),
    }),
    {
      name: 'sound-storage',
    },
  ),
);
