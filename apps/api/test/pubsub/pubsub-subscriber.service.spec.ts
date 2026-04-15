import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import RedisMock from 'ioredis-mock';

import { BattleGateway } from '@/battle/battle.gateway';
import { BattleService } from '@/battle/battle.service';
import { PubsubGateway } from '@/pubsub/pubsub.gateway';
import { PubsubSubscriberService } from '@/pubsub/pubsub-subscriber.service';
import { REDIS_CLIENT } from '@/redis/redis.module';
import { Submission } from '@/submission/submission.entity';

describe('PubsubSubscriberService — submissionId 단위 처리 큐', () => {
  let service: PubsubSubscriberService;
  let redis: RedisMock;

  beforeEach(async () => {
    redis = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubsubSubscriberService,
        { provide: REDIS_CLIENT, useValue: redis },
        { provide: getRepositoryToken(Submission), useValue: { findOne: jest.fn() } },
        { provide: PubsubGateway, useValue: {} },
        { provide: BattleGateway, useValue: {} },
        { provide: BattleService, useValue: {} },
      ],
    }).compile();

    service = module.get<PubsubSubscriberService>(PubsubSubscriberService);
  });

  it('같은 submissionId의 메시지는 순서대로 처리된다', async () => {
    const processOrder: number[] = [];
    const enqueue = (service as any).enqueue.bind(service);

    enqueue('sub-1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      processOrder.push(1);
    });
    enqueue('sub-1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      processOrder.push(2);
    });
    enqueue('sub-1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      processOrder.push(3);
    });

    await (service as any).queues.get('sub-1');

    expect(processOrder).toEqual([1, 2, 3]);
  });

  it('서로 다른 submissionId의 메시지는 동시에 처리된다', async () => {
    const startTimes: Record<string, number> = {};
    const enqueue = (service as any).enqueue.bind(service);

    enqueue('sub-1', async () => {
      startTimes['sub-1'] = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    enqueue('sub-2', async () => {
      startTimes['sub-2'] = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await Promise.all([(service as any).queues.get('sub-1'), (service as any).queues.get('sub-2')]);

    expect(Math.abs(startTimes['sub-1'] - startTimes['sub-2'])).toBeLessThan(50);
  });

  it('처리 완료 후 큐에서 메모리가 정리된다', async () => {
    const enqueue = (service as any).enqueue.bind(service);

    enqueue('sub-1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await (service as any).queues.get('sub-1');

    expect((service as any).queues.has('sub-1')).toBe(false);
  });
});
