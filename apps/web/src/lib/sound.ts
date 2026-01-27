import battleEndUrl from '@/sounds/battle-end.mp3';
import timerTicksUrl from '@/sounds/timer-ticks.mp3';

/**
 * 타이머 카운트다운용 소리 재생
 */
export const playCountdownSound = (type: 'tick' | 'warning' | 'end') => {
  if (type === 'tick' || type === 'warning') {
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
