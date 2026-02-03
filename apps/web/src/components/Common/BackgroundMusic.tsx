import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useSoundStore } from '@/stores/soundStore';

export default function BackgroundMusic() {
  const { bgmVolume, isBgmMuted } = useSoundStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);
  const bgmStateRef = useRef({ volume: bgmVolume, muted: isBgmMuted });
  const { pathname } = useLocation();

  useEffect(() => {
    const audio = new Audio('/sounds/background-music.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = bgmVolume;
    audio.muted = isBgmMuted;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bgmStateRef.current = { volume: bgmVolume, muted: isBgmMuted };
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = bgmVolume;
    audio.muted = isBgmMuted;

    if (isBgmMuted || bgmVolume <= 0) {
      audio.pause();
      return;
    }

    if (hasInteractedRef.current) {
      audio.play().catch(() => {});
    }
  }, [bgmVolume, isBgmMuted]);

  // 자동 재생 제한(브라우저 정책) 때문에 사용자 상호작용 이후에만 재생 시작
  useEffect(() => {
    if (hasInteractedRef.current) return;
    if (pathname !== '/') return;

    const handleUnlock = () => {
      if (hasInteractedRef.current) return;
      hasInteractedRef.current = true;
      const audio = audioRef.current;
      const { muted, volume } = bgmStateRef.current;
      if (!audio || muted || volume <= 0) return;
      audio.play().catch(() => {});
    };

    window.addEventListener('pointerdown', handleUnlock, { once: true });
    window.addEventListener('keydown', handleUnlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, [pathname]);

  return null;
}
