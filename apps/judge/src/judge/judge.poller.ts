import { Injectable } from '@nestjs/common';

@Injectable()
export class JudgePoller {
  private readonly POLL_INTERVAL = 300;
  private readonly MAX_POLL_TIME = 60000;

  async poll(
    checkFn: () => Promise<boolean> | boolean,
    processFn: () => Promise<void> | void,
    isCompleteFn: () => Promise<boolean> | boolean,
  ): Promise<void> {
    const startTime = Date.now();

    while (true) {
      // 타임아웃 체크
      if (Date.now() - startTime > this.MAX_POLL_TIME) {
        throw new Error('Polling timed out');
      }

      // 새 데이터 체크
      if (await checkFn()) {
        await processFn();
      }

      // 완료 확인
      if (await isCompleteFn()) break;

      // 대기
      await this.sleep(this.POLL_INTERVAL);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
