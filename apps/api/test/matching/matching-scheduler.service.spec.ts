/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { MatchingUser } from '@packages/types/matching';

import { MatchingGateway } from '../../src/matching/matching.gateway';
import { MatchingService } from '../../src/matching/matching.service';
import { MatchingSchedulerService } from '../../src/matching/matching-scheduler.service';

describe('MatchingSchedulerService', () => {
  let service: MatchingSchedulerService;
  let mockMatchingService: any;
  let mockMatchingGateway: any;

  const createMockUser = (userId: string): MatchingUser => ({
    userId,
    username: `User${userId}`,
    rating: 1500,
    tier: { tier: 'Gold', division: 3 },
    status: 'MATCHED',
    waitingSince: new Date(),
    socketId: `socket-${userId}`,
  });

  beforeEach(async () => {
    mockMatchingService = {
      matchUsers: jest.fn(),
      getMatchingStats: jest.fn(),
      getMatchingQueueSocketIds: jest.fn(),
    };

    mockMatchingGateway = {
      broadcastMatchingStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingSchedulerService,
        {
          provide: MatchingService,
          useValue: mockMatchingService,
        },
        {
          provide: MatchingGateway,
          useValue: mockMatchingGateway,
        },
      ],
    }).compile();

    service = module.get<MatchingSchedulerService>(MatchingSchedulerService);
  });

  describe('handleMatchingTick', () => {
    it('MatchingService.matchUsers()를 호출해야 한다', async () => {
      mockMatchingService.matchUsers.mockResolvedValue([]);

      await service.handleMatchingTick();

      expect(mockMatchingService.matchUsers).toHaveBeenCalledTimes(1);
    });

    it('매칭 성공 시 성공 로그를 출력해야 한다', async () => {
      const matchedUsers = [createMockUser('user1'), createMockUser('user2')];
      mockMatchingService.matchUsers.mockResolvedValue(matchedUsers);

      const loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.handleMatchingTick();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('매칭 성공: 1쌍 (2명)'));
    });

    it('매칭된 유저가 없으면 로그를 출력하지 않아야 한다', async () => {
      mockMatchingService.matchUsers.mockResolvedValue([]);

      const loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.handleMatchingTick();

      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('에러 발생 시 에러 로그를 출력해야 한다', async () => {
      const error = new Error('Redis connection failed');
      mockMatchingService.matchUsers.mockRejectedValue(error);

      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      await service.handleMatchingTick();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('매칭 Tick 에러: Redis connection failed'),
      );
    });

    it('여러 쌍 매칭 시 올바른 숫자를 로그에 출력해야 한다', async () => {
      const matchedUsers = [
        createMockUser('user1'),
        createMockUser('user2'),
        createMockUser('user3'),
        createMockUser('user4'),
        createMockUser('user5'),
        createMockUser('user6'),
      ];
      mockMatchingService.matchUsers.mockResolvedValue(matchedUsers);

      const loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.handleMatchingTick();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('매칭 성공: 3쌍 (6명)'));
    });
  });
});
