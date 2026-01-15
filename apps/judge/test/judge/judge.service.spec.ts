/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

import { JudgeChecker } from '../../src/judge/judge.checker';
import { JudgePoller } from '../../src/judge/judge.poller';
import { JudgeReader } from '../../src/judge/judge.reader';
import { JudgeService } from '../../src/judge/judge.service';
import { PubsubService } from '../../src/pubsub/pubsub.service';

describe('JudgeService (Integration Flow)', () => {
  let service: JudgeService;
  let reader: JudgeReader;
  let pubsub: PubsubService;

  beforeEach(async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeService,
        JudgePoller,
        JudgeChecker,
        {
          provide: JudgeReader,
          useValue: {
            readMetadata: jest.fn(),
            loadTestcases: jest.fn(),
            hasOutputFile: jest.fn(),
            readOutputFile: jest.fn(),
            isContainerFinished: jest.fn(),
          },
        },
        {
          provide: PubsubService,
          useValue: {
            publishTestcaseUpdate: jest.fn(),
            publishFinalResult: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JudgeService>(JudgeService);
    reader = module.get<JudgeReader>(JudgeReader);
    pubsub = module.get<PubsubService>(PubsubService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('모든 테스트케이스를 통과하면 ACCEPTED 결과를 발행해야 한다', async () => {
    const submissionId = 123;
    (reader.readMetadata as jest.Mock).mockReturnValue({ problemId: 1, type: 'SUBMISSION' });
    (reader.loadTestcases as jest.Mock).mockReturnValue([
      { input: '1', output: 'A' },
      { input: '2', output: 'B' },
    ]);

    (reader.hasOutputFile as jest.Mock).mockReturnValue(true);
    (reader.readOutputFile as jest.Mock).mockReturnValueOnce('A').mockReturnValueOnce('B');

    const judgePromise = service.judgeSubmission(submissionId);

    for (let i = 0; i < 10; i++) {
      // 시간 가속
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    }

    await judgePromise;

    expect(pubsub.publishFinalResult).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACCEPTED' }),
    );
  });

  it('테스트케이스 중 하나라도 틀리면 WRONG_ANSWER 결과를 발행해야 한다', async () => {
    const submissionId = 456;
    (reader.readMetadata as jest.Mock).mockReturnValue({ problemId: 1, type: 'SUBMISSION' });

    (reader.loadTestcases as jest.Mock).mockReturnValue([
      { input: '1', output: 'A' },
      { input: '2', output: 'B' },
    ]);

    (reader.hasOutputFile as jest.Mock).mockReturnValue(true);

    (reader.readOutputFile as jest.Mock).mockReturnValueOnce('A').mockReturnValueOnce('C');

    const judgePromise = service.judgeSubmission(submissionId);

    // 시간 가속
    for (let i = 0; i < 10; i++) {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    }

    await judgePromise;

    expect(pubsub.publishFinalResult).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'WRONG_ANSWER',
        result: expect.objectContaining({
          passed: 1, // 2개 중 1개만 맞음
          total: 2,
        }),
      }),
    );
  });
});
