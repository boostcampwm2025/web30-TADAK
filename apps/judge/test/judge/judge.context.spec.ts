/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { JudgeChecker } from '../../src/judge/judge.checker';
import { JudgeContext } from '../../src/judge/judge.context';
import { JudgeReader } from '../../src/judge/judge.reader';
import { Testcase } from '../../src/judge/judge.types';
import { PubsubService } from '../../src/pubsub/pubsub.service';

describe('JudgeContext - 채점 결과 누적 및 통계', () => {
  let context: JudgeContext;
  let mockReader: jest.Mocked<JudgeReader>;
  let mockChecker: jest.Mocked<JudgeChecker>;
  let mockPubsub: jest.Mocked<PubsubService>;

  const testcases: Testcase[] = [
    { id: 1, input: '1 2', output: '3' },
    { id: 2, input: '2 3', output: '5' },
    { id: 3, input: '3 4', output: '7' },
  ];

  beforeEach(() => {
    mockReader = {
      hasOutputFile: jest.fn(),
      readOutputFile: jest.fn(),
    } as any;

    mockChecker = {
      normalize: jest.fn((str) => str.trim()),
      compare: jest.fn(),
    } as any;

    mockPubsub = {
      publishTestcaseUpdate: jest.fn(),
      publishFinalResult: jest.fn(),
    } as any;

    context = new JudgeContext('test-submission-1', testcases, mockReader, mockChecker, mockPubsub);
  });

  describe('hasNewOutput', () => {
    it('다음 출력 파일이 있으면 true를 반환해야 한다', () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      const result = context.hasNewOutput();
      expect(result).toBe(true);
      expect(mockReader.hasOutputFile).toHaveBeenCalledWith('test-submission-1', 0);
    });

    it('다음 출력 파일이 없으면 false를 반환해야 한다', () => {
      mockReader.hasOutputFile.mockReturnValue(false);
      const result = context.hasNewOutput();
      expect(result).toBe(false);
    });
  });

  describe('process', () => {
    it('정답인 경우 통계를 올바르게 업데이트해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile.mockReturnValue({
        output: '3',
        time: 100,
        memory: 2048,
        status: 'ACCEPTED',
      });
      mockChecker.compare.mockReturnValue(true);

      await context.process();

      expect(mockPubsub.publishTestcaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          testcase: expect.objectContaining({
            status: 'ACCEPTED',
            time: 100,
            memory: 2048,
          }),
          progress: expect.objectContaining({
            completed: 1,
            passed: 1,
            total: 3,
          }),
        }),
      );
    });

    it('오답인 경우 WRONG_ANSWER 상태를 발행해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile.mockReturnValue({
        output: '999',
        time: 50,
        memory: 1024,
        status: 'ACCEPTED',
      });
      mockChecker.compare.mockReturnValue(false);

      await context.process();

      expect(mockPubsub.publishTestcaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          testcase: expect.objectContaining({
            status: 'WRONG_ANSWER',
          }),
          progress: expect.objectContaining({
            passed: 0,
          }),
        }),
      );
    });

    it('RUNTIME_ERROR 상태는 그대로 유지되어야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile.mockReturnValue({
        output: 'error output',
        time: 30,
        memory: 512,
        status: 'RUNTIME_ERROR',
      });

      await context.process();

      expect(mockPubsub.publishTestcaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          testcase: expect.objectContaining({
            status: 'RUNTIME_ERROR',
          }),
        }),
      );
      expect(mockChecker.compare).not.toHaveBeenCalled();
    });
  });

  describe('isAllCompleted', () => {
    it('모든 테스트케이스를 처리하면 true를 반환해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile.mockReturnValue({
        output: '3',
        time: 10,
        memory: 100,
        status: 'ACCEPTED',
      });
      mockChecker.compare.mockReturnValue(true);

      await context.process();

      expect(context.isAllCompleted()).toBe(true);
    });

    it('일부만 처리하면 false를 반환해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValueOnce(true).mockReturnValueOnce(false);
      mockReader.readOutputFile.mockReturnValue({
        output: '3',
        time: 10,
        memory: 100,
        status: 'ACCEPTED',
      });
      mockChecker.compare.mockReturnValue(true);

      await context.process();

      expect(context.isAllCompleted()).toBe(false);
    });
  });

  describe('reportFinalResult', () => {
    it('모든 테스트케이스 통과 시 ACCEPTED를 발행해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile
        .mockReturnValueOnce({ output: '3', time: 10, memory: 100, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '5', time: 20, memory: 200, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '7', time: 30, memory: 300, status: 'ACCEPTED' });
      mockChecker.compare.mockReturnValue(true);

      await context.process();
      await context.reportFinalResult();

      expect(mockPubsub.publishFinalResult).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACCEPTED',
          result: {
            passed: 3,
            total: 3,
            time: 30,
            memory: 300,
          },
        }),
      );
    });

    it('하나라도 틀리면 WRONG_ANSWER를 발행해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile
        .mockReturnValueOnce({ output: '3', time: 10, memory: 100, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '999', time: 20, memory: 200, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '7', time: 30, memory: 300, status: 'ACCEPTED' });
      mockChecker.compare
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      await context.process();
      await context.reportFinalResult();

      expect(mockPubsub.publishFinalResult).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'WRONG_ANSWER',
          result: {
            passed: 2,
            total: 3,
            time: 30,
            memory: 300,
          },
        }),
      );
    });

    it('maxTime과 maxMemory를 올바르게 계산해야 한다', async () => {
      mockReader.hasOutputFile.mockReturnValue(true);
      mockReader.readOutputFile
        .mockReturnValueOnce({ output: '3', time: 50, memory: 2000, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '5', time: 100, memory: 1500, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '7', time: 30, memory: 3000, status: 'ACCEPTED' });
      mockChecker.compare.mockReturnValue(true);

      await context.process();
      await context.reportFinalResult();

      expect(mockPubsub.publishFinalResult).toHaveBeenCalledWith(
        expect.objectContaining({
          result: {
            passed: 3,
            total: 3,
            time: 100,
            memory: 3000,
          },
        }),
      );
    });
  });

  describe('getSummary', () => {
    it('현재 진행 상황을 반환해야 한다', async () => {
      mockReader.hasOutputFile
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      mockReader.readOutputFile
        .mockReturnValueOnce({ output: '3', time: 10, memory: 100, status: 'ACCEPTED' })
        .mockReturnValueOnce({ output: '999', time: 20, memory: 200, status: 'ACCEPTED' });
      mockChecker.compare.mockReturnValueOnce(true).mockReturnValueOnce(false);

      await context.process();

      const summary = context.getSummary();
      expect(summary).toEqual({
        passed: 1,
        total: 3,
      });
    });
  });
});
