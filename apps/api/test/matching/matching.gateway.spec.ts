/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { SOCKET_EVENT } from '@packages/constants/socket-event';
import { Battle } from '@packages/types/battle';
import { MatchingUser } from '@packages/types/matching';
import { Room } from '@packages/types/room';

import { MatchingGateway } from '../../src/matching/matching.gateway';

describe('MatchingGateway', () => {
  let gateway: MatchingGateway;
  let mockServer: any;

  const createMockUser = (userId: string, rating: number, username: string): MatchingUser => ({
    userId,
    username,
    rating,
    tier: { tier: 'Gold', division: 3 },
    status: 'MATCHED',
    waitingSince: new Date(),
    socketId: `socket-${userId}`,
  });

  const mockRoom: Room = {
    roomId: 'room-123',
    title: 'Test Room',
    hostId: 'system',
    status: 'in-battle',
    createdAt: new Date(),
    currentPlayers: [],
    currentSpectators: [],
    settings: { maxPlayers: 2 },
  };

  const mockBattle: Battle = {
    battleId: 'battle-123',
    roomId: 'room-123',
    status: 'running',
    config: { duration: 300 },
    startedAt: new Date(),
    users: [],
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchingGateway],
    }).compile();

    gateway = module.get<MatchingGateway>(MatchingGateway);
    gateway.server = mockServer;
  });

  describe('emitMatchSuccess', () => {
    it('user1에게 매칭 성공 이벤트를 전송해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle);

      expect(mockServer.to).toHaveBeenCalledWith('socket-user1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        SOCKET_EVENT.MATCH_SUCCESS,
        expect.objectContaining({
          roomId: 'room-123',
          battleId: 'battle-123',
          room: mockRoom,
          battle: mockBattle,
          opponent: {
            userId: 'user2',
            username: 'User2',
            rating: 1550,
            tier: { tier: 'Gold', division: 3 },
          },
        }),
      );
    });

    it('user2에게 매칭 성공 이벤트를 전송해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle);

      expect(mockServer.to).toHaveBeenCalledWith('socket-user2');
      expect(mockServer.emit).toHaveBeenCalledWith(
        SOCKET_EVENT.MATCH_SUCCESS,
        expect.objectContaining({
          roomId: 'room-123',
          battleId: 'battle-123',
          room: mockRoom,
          battle: mockBattle,
          opponent: {
            userId: 'user1',
            username: 'User1',
            rating: 1500,
            tier: { tier: 'Gold', division: 3 },
          },
        }),
      );
    });

    it('양쪽 유저에게 각각 2번 이벤트를 전송해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('각 유저는 상대방의 정보를 받아야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle);

      // user1이 받는 데이터에는 user2 정보
      const user1CallArgs = mockServer.emit.mock.calls.find(
        (call) =>
          call[1].opponent.userId === 'user2' &&
          mockServer.to.mock.calls.some((toCall) => toCall[0] === 'socket-user1'),
      );
      expect(user1CallArgs).toBeDefined();
      expect(user1CallArgs[1].opponent.username).toBe('User2');

      // user2가 받는 데이터에는 user1 정보
      const user2CallArgs = mockServer.emit.mock.calls.find(
        (call) =>
          call[1].opponent.userId === 'user1' &&
          mockServer.to.mock.calls.some((toCall) => toCall[0] === 'socket-user2'),
      );
      expect(user2CallArgs).toBeDefined();
      expect(user2CallArgs[1].opponent.username).toBe('User1');
    });

    it('room과 battle 정보가 포함되어야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle);

      expect(mockServer.emit).toHaveBeenCalledWith(
        SOCKET_EVENT.MATCH_SUCCESS,
        expect.objectContaining({
          room: mockRoom,
          battle: mockBattle,
        }),
      );
    });

    it('올바른 소켓 이벤트명을 사용해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle);

      expect(mockServer.emit).toHaveBeenCalledWith(SOCKET_EVENT.MATCH_SUCCESS, expect.any(Object));
    });
  });
});
