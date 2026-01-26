import { JudgePoller } from '../../src/judge/judge.poller';

describe('JudgePoller', () => {
  let poller: JudgePoller;

  beforeEach(() => {
    poller = new JudgePoller();
  });

  describe('기본 동작', () => {
    it('완료 조건이 충족되면 polling을 종료해야 한다', async () => {
      let iterations = 0;

      await poller.poll(
        () => false, // 새 데이터 없음
        () => {},
        () => {
          iterations++;
          return iterations >= 3; // 3번 체크하면 완료
        },
      );

      expect(iterations).toBe(3);
    });

    it('체크 함수가 true를 반환하면 처리 함수를 실행해야 한다', async () => {
      let processed = false;

      await poller.poll(
        () => true, // 새 데이터 있음
        () => {
          processed = true;
        },
        () => processed, // 처리되면 완료
      );

      expect(processed).toBe(true);
    });
  });

  describe('타임아웃 처리', () => {
    it('60초(MAX_POLL_TIME) 초과 시 타임아웃 에러를 던져야 한다', async () => {
      const start = Date.now();

      await expect(
        poller.poll(
          () => false, // 새 데이터 없음
          () => {},
          () => false, // 절대 완료되지 않음
        ),
      ).rejects.toThrow('Polling timed out');

      const elapsed = Date.now() - start;
      // 60초 이상 걸렸는지 확인 (여유 시간 포함)
      expect(elapsed).toBeGreaterThanOrEqual(60000);
    }, 65000); // Jest 타임아웃 65초로 설정

    it('60초 이내에 완료되면 타임아웃이 발생하지 않아야 한다', async () => {
      const start = Date.now();

      await poller.poll(
        () => false,
        () => {},
        () => true, // 즉시 완료
      );

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000); // 1초 이내 완료
    });
  });

  describe('실제 채점 시나리오', () => {
    it('파일이 순차적으로 생성되는 경우 정상 처리해야 한다', async () => {
      const files = [false, false, false];
      let currentFileIndex = 0;

      await poller.poll(
        () => {
          // 새 파일이 생성되었는지
          return currentFileIndex < files.length && !files[currentFileIndex];
        },
        () => {
          // 파일 처리
          files[currentFileIndex] = true;
          currentFileIndex++;
        },
        () => {
          // 모든 파일 처리 완료
          return currentFileIndex >= files.length;
        },
      );

      expect(files).toEqual([true, true, true]);
      expect(currentFileIndex).toBe(3);
    });
  });
});
