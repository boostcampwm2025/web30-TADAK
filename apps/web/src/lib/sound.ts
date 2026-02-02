import { useSoundStore } from '@/stores/soundStore';

// 음악 파일 URL (public 폴더)
const SOUND_URLS = {
  battleEnd: '/sounds/battle-end.mp3',
  battleReady: '/sounds/battle-ready.mp3',
  battleStart: '/sounds/battle-start.mp3',
  timerTicks: '/sounds/timer-ticks.mp3',
} as const;

/**
 * 전역 설정에 따른 오디오 재생
 */
const playAudio = (url: string) => {
  const { volume, isMuted } = useSoundStore.getState();
  if (isMuted) return;

  try {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play();
  } catch (error) {
    console.warn('Failed to play audio:', error);
  }
};

/**
 * 타이머 카운트다운용 소리 재생
 */
export const playCountdownSound = (type: 'tick' | 'end') => {
  if (type === 'tick') {
    playAudio(SOUND_URLS.timerTicks);
  } else if (type === 'end') {
    playAudio(SOUND_URLS.battleEnd);
  }
};

/**
 * 배틀 준비 카운트다운용 소리 재생
 */
export const playBattleCountdownSound = (type: 'tick' | 'end') => {
  if (type === 'tick') {
    playAudio(SOUND_URLS.battleReady);
  } else if (type === 'end') {
    playAudio(SOUND_URLS.battleStart);
  }
};

/**
 * 볼륨 조절 확인용 소리 재생
 */
export const playPreviewSound = () => {
  playAudio(SOUND_URLS.battleEnd);
};
