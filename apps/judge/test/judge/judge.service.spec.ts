import { Test, TestingModule } from '@nestjs/testing';

import { JudgeChecker } from '../../src/judge/judge.checker';
import { JudgePoller } from '../../src/judge/judge.poller';
import { JudgeReader } from '../../src/judge/judge.reader';
import { JudgeService } from '../../src/judge/judge.service';
import { PubsubService } from '../../src/pubsub/pubsub.service';

describe('JudgeService - 채점 서비스 전체 흐름 관리', () => {
  let service: JudgeService;
  let reader: JudgeReader;
  let poller: JudgePoller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeService,
        {
          provide: JudgeReader,
          useValue: {
            readMetadata: jest.fn(),
            loadTestcases: jest.fn(),
            hasOutputFile: jest.fn(),
            readOutputFile: jest.fn(),
          },
        },
        {
          provide: JudgeChecker,
          useValue: {
            compare: jest.fn(),
            normalize: jest.fn(),
          },
        },
        {
          provide: JudgePoller,
          useValue: {
            // poll은 호출만 확인, 실제 콜백 실행은 하지 않음 (순수 단위 테스트)
            poll: jest.fn().mockResolvedValue(undefined),
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
    poller = module.get<JudgePoller>(JudgePoller);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('메타데이터와 테스트케이스를 읽고 poller를 호출해야 한다', async () => {
    const submissionId = '123';

    // Reader Mock
    (reader.readMetadata as jest.Mock).mockReturnValue({
      problemId: 'beta_easy_1',
      type: 'SUBMISSION',
      timeLimit: 1000,
      memoryLimit: 128,
    });
    (reader.loadTestcases as jest.Mock).mockReturnValue([
      { id: 1, input: '1', output: 'A' },
      { id: 2, input: '2', output: 'B' },
    ]);

    // 실행
    await service.judgeSubmission(submissionId);

    // 검증 - JudgeService가 올바른 순서로 의존성을 호출했는지 확인
    expect(reader.readMetadata).toHaveBeenCalledWith(submissionId);
    expect(reader.loadTestcases).toHaveBeenCalledWith('beta_easy_1', 'SUBMISSION');
    expect(poller.poll).toHaveBeenCalledWith(
      expect.any(Function), // checkFn
      expect.any(Function), // processFn
      expect.any(Function), // isCompleteFn
    );
  });

  it('다른 타입의 제출도 올바르게 처리해야 한다', async () => {
    const submissionId = '456';

    (reader.readMetadata as jest.Mock).mockReturnValue({
      problemId: 'beta_hard_1',
      type: 'TEST',
      timeLimit: 2000,
      memoryLimit: 256,
    });
    (reader.loadTestcases as jest.Mock).mockReturnValue([{ id: 1, input: '1', output: 'A' }]);

    await service.judgeSubmission(submissionId);

    expect(reader.readMetadata).toHaveBeenCalledWith(submissionId);
    expect(reader.loadTestcases).toHaveBeenCalledWith('beta_hard_1', 'TEST');
    expect(poller.poll).toHaveBeenCalled();
  });

  it('JudgeContext를 생성하고 poller에 올바른 콜백을 전달해야 한다', async () => {
    const submissionId = '999';

    (reader.readMetadata as jest.Mock).mockReturnValue({
      problemId: 'beta_easy_1',
      type: 'TEST',
      timeLimit: 1000,
      memoryLimit: 128,
    });
    (reader.loadTestcases as jest.Mock).mockReturnValue([{ id: 1, input: '1', output: 'A' }]);

    await service.judgeSubmission(submissionId);

    // poller.poll이 3개의 함수(checkFn, processFn, isCompleteFn)와 함께 호출되었는지 확인
    expect(poller.poll).toHaveBeenCalledTimes(1);
    const pollCall = (poller.poll as jest.Mock).mock.calls[0];
    expect(pollCall).toHaveLength(3);
    expect(typeof pollCall[0]).toBe('function'); // checkFn
    expect(typeof pollCall[1]).toBe('function'); // processFn
    expect(typeof pollCall[2]).toBe('function'); // isCompleteFn
  });
});
