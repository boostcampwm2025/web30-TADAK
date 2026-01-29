import battleEndUrl from '@/sounds/battle-end.mp3';
import battleReadyUrl from '@/sounds/battle-ready.mp3';
import battleStartUrl from '@/sounds/battle-start.mp3';
import timerTicksUrl from '@/sounds/timer-ticks.mp3';
import { useSoundStore } from '@/stores/soundStore';

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
    playAudio(timerTicksUrl);
  } else if (type === 'end') {
    playAudio(battleEndUrl);
  }
};

/**
 * 배틀 준비 카운트다운용 소리 재생
 */
export const playBattleCountdownSound = (type: 'tick' | 'end') => {
  if (type === 'tick') {
    playAudio(battleReadyUrl);
  } else if (type === 'end') {
    playAudio(battleStartUrl);
  }
};

/**
 * 볼륨 조절 확인용 소리 재생
 */
export const playPreviewSound = () => {
  playAudio(battleEndUrl);
};
