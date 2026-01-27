import battleEndUrl from '@/sounds/battle-end.mp3';
import battleReadyUrl from '@/sounds/battle-ready.mp3';
import battleStartUrl from '@/sounds/battle-start.mp3';
import timerTicksUrl from '@/sounds/timer-ticks.mp3';

/**
 * 타이머 카운트다운용 소리 재생
 */
export const playCountdownSound = (type: 'tick' | 'end') => {
  if (type === 'tick') {
    try {
      const audio = new Audio(timerTicksUrl);
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.warn('Failed to play mp3 sound, falling back to beep:', error);
    }
  } else if (type === 'end') {
    try {
      const audio = new Audio(battleEndUrl);
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.warn('Failed to play mp3 sound, falling back to beep:', error);
    }
  }
};

/**
 * 배틀 준비 카운트다운용 소리 재생
 */
export const playBattleCountdownSound = (type: 'tick' | 'end') => {
  if (type === 'tick') {
    try {
      const audio = new Audio(battleReadyUrl);
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.warn('Failed to play mp3 sound, falling back to beep:', error);
    }
  } else if (type === 'end') {
    try {
      const audio = new Audio(battleStartUrl);
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.warn('Failed to play mp3 sound, falling back to beep:', error);
    }
  }
};
