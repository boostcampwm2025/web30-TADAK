/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { SOCKET_EVENT } from '@packages/constants/socket-event';
import { Battle } from '@packages/types/battle';
import { MatchingUser } from '@packages/types/matching';
import { Room } from '@packages/types/room';

import { MatchingGateway } from '../../src/matching/matching.gateway';
import { MatchingService } from '../../src/matching/matching.service';
import { RoomService } from '../../src/room/room.service';

describe('MatchingGateway', () => {
  let gateway: MatchingGateway;
  let mockServer: any;
  let mockMatchingService: any;
  let mockRoomService: any;

  const createMockUser = (userId: string, rating: number, username: string): MatchingUser => ({
    userId,
    username,
    rating,
    tier: { tier: 'Gold', division: 3 },
    status: 'MATCHED',
    waitingSince: new Date(),
    socketId: `socket-${userId}`,
    myRate: { win: 10, lose: 5, draw: 0, winRate: 66 },
    avatarUrl: `https://avatar.com/${userId}`,
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
    problemId: 'problem-123',
    status: 'running',
    config: { duration: 300 },
    startedAt: new Date(),
    users: [],
  };

  const mockProblemInfo = {
    id: 'problem-123',
    title: 'Test Problem',
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: new Map(),
    };

    mockMatchingService = {
      cancelMatching: jest.fn().mockResolvedValue(undefined),
    };

    mockRoomService = {
      listRooms: jest.fn().mockResolvedValue([]),
      toPublicRooms: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingGateway,
        {
          provide: MatchingService,
          useValue: mockMatchingService,
        },
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
      ],
    }).compile();

    gateway = module.get<MatchingGateway>(MatchingGateway);
    gateway.server = mockServer;
  });

  describe('emitMatchSuccess', () => {
    it('user1에게 매칭 성공 이벤트를 전송해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      expect(mockServer.to).toHaveBeenCalledWith('socket-user1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        SOCKET_EVENT.MATCH_SUCCESS,
        expect.objectContaining({
          roomId: 'room-123',
          battleId: 'battle-123',
          myRate: user1.myRate,
          opponent: {
            userId: 'user2',
            username: 'User2',
            avatarUrl: 'https://avatar.com/user2',
            rating: 1550,
            tier: { tier: 'Gold', division: 3 },
            rate: user2.myRate,
          },
          problem: mockProblemInfo,
        }),
      );
    });

    it('user2에게 매칭 성공 이벤트를 전송해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      expect(mockServer.to).toHaveBeenCalledWith('socket-user2');
      expect(mockServer.emit).toHaveBeenCalledWith(
        SOCKET_EVENT.MATCH_SUCCESS,
        expect.objectContaining({
          roomId: 'room-123',
          battleId: 'battle-123',
          myRate: user2.myRate,
          opponent: {
            userId: 'user1',
            username: 'User1',
            avatarUrl: 'https://avatar.com/user1',
            rating: 1500,
            tier: { tier: 'Gold', division: 3 },
            rate: user1.myRate,
          },
          problem: mockProblemInfo,
        }),
      );
    });

    it('양쪽 유저에게 각각 2번 이벤트를 전송해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      expect(mockServer.to).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('각 유저는 상대방의 정보를 받아야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      // user1이 받는 데이터에는 user2 정보
      const user1Call = mockServer.emit.mock.calls.find(
        (call: any[]) => call[1].opponent.userId === 'user2',
      );
      expect(user1Call).toBeDefined();
      expect(user1Call[1].opponent.username).toBe('User2');
      expect(user1Call[1].opponent.avatarUrl).toBe('https://avatar.com/user2');

      // user2가 받는 데이터에는 user1 정보
      const user2Call = mockServer.emit.mock.calls.find(
        (call: any[]) => call[1].opponent.userId === 'user1',
      );
      expect(user2Call).toBeDefined();
      expect(user2Call[1].opponent.username).toBe('User1');
      expect(user2Call[1].opponent.avatarUrl).toBe('https://avatar.com/user1');
    });

    it('problem 정보가 포함되어야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      expect(mockServer.emit).toHaveBeenCalledWith(
        SOCKET_EVENT.MATCH_SUCCESS,
        expect.objectContaining({
          problem: {
            id: 'problem-123',
            title: 'Test Problem',
          },
        }),
      );
    });

    it('올바른 소켓 이벤트명을 사용해야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      expect(mockServer.emit).toHaveBeenCalledWith(SOCKET_EVENT.MATCH_SUCCESS, expect.any(Object));
    });

    it('myRate가 각 유저에게 올바르게 전송되어야 한다', () => {
      const user1 = createMockUser('user1', 1500, 'User1');
      const user2 = createMockUser('user2', 1550, 'User2');

      gateway.emitMatchSuccess(user1, user2, mockRoom, mockBattle, mockProblemInfo);

      // 첫 번째 emit (user1에게)
      const firstCall = mockServer.emit.mock.calls[0];
      expect(firstCall[1].myRate).toEqual(user1.myRate);

      // 두 번째 emit (user2에게)
      const secondCall = mockServer.emit.mock.calls[1];
      expect(secondCall[1].myRate).toEqual(user2.myRate);
    });
  });

  describe('broadcastMatchingStats', () => {
    it('지정된 소켓들에게 통계를 브로드캐스트해야 한다', () => {
      const stats = {
        waitingPlayers: 5,
        ongoingBattles: 3,
        avgMatchTime: 15,
      };
      const socketIds = ['socket-1', 'socket-2', 'socket-3'];

      gateway.broadcastMatchingStats(stats, socketIds);

      expect(mockServer.to).toHaveBeenCalledTimes(3);
      expect(mockServer.to).toHaveBeenCalledWith('socket-1');
      expect(mockServer.to).toHaveBeenCalledWith('socket-2');
      expect(mockServer.to).toHaveBeenCalledWith('socket-3');
      expect(mockServer.emit).toHaveBeenCalledWith(SOCKET_EVENT.STATS_UPDATE, stats);
    });

    it('소켓 ID가 없으면 emit하지 않아야 한다', () => {
      const stats = {
        waitingPlayers: 5,
        ongoingBattles: 3,
        avgMatchTime: 15,
      };

      gateway.broadcastMatchingStats(stats, []);

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('emitMatchingTimeout', () => {
    it('매칭 지연 알림을 전송해야 한다', () => {
      gateway.emitMatchingTimeout('socket-user1');

      expect(mockServer.to).toHaveBeenCalledWith('socket-user1');
      expect(mockServer.emit).toHaveBeenCalledWith(SOCKET_EVENT.MATCHING_TIMEOUT, {
        message: '매칭이 지연되고 있습니다.',
      });
    });
  });

  describe('emitOpponentDisconnected', () => {
    it('상대방 연결 끊김 알림을 전송해야 한다', () => {
      gateway.emitOpponentDisconnected('socket-user1');

      expect(mockServer.to).toHaveBeenCalledWith('socket-user1');
      expect(mockServer.emit).toHaveBeenCalledWith(SOCKET_EVENT.OPPONENT_DISCONNECTED, {
        message: '상대방의 연결이 끊겨 매칭이 취소되었습니다.',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('유저 ID가 있으면 매칭을 취소해야 한다', async () => {
      const mockSocket = {
        data: { userId: 'user1' },
      } as any;

      await gateway.handleDisconnect(mockSocket);

      expect(mockMatchingService.cancelMatching).toHaveBeenCalledWith('user1');
    });

    it('유저 ID가 없으면 매칭 취소를 호출하지 않아야 한다', async () => {
      const mockSocket = {
        data: {},
      } as any;

      await gateway.handleDisconnect(mockSocket);

      expect(mockMatchingService.cancelMatching).not.toHaveBeenCalled();
    });
  });

  describe('registerUserSocket', () => {
    it('소켓에 유저 ID를 등록해야 한다', () => {
      const mockSocket = {
        data: {} as { userId?: string },
      };
      mockServer.sockets.set('socket-user1', mockSocket);

      gateway.registerUserSocket('socket-user1', 'user1');

      expect(mockSocket.data.userId).toBe('user1');
    });

    it('소켓이 없으면 등록하지 않아야 한다', () => {
      // 소켓이 없는 상태에서 호출해도 에러가 발생하지 않아야 함
      expect(() => {
        gateway.registerUserSocket('nonexistent-socket', 'user1');
      }).not.toThrow();
    });
  });

  describe('broadcastRoomList', () => {
    it('방 목록을 모든 클라이언트에게 브로드캐스트해야 한다', async () => {
      const mockRooms = [
        { roomId: 'room-1', title: 'Room 1' },
        { roomId: 'room-2', title: 'Room 2' },
      ];
      mockRoomService.listRooms.mockResolvedValue(mockRooms);
      mockRoomService.toPublicRooms.mockReturnValue(mockRooms);

      await gateway.broadcastRoomList();

      expect(mockRoomService.listRooms).toHaveBeenCalled();
      expect(mockRoomService.toPublicRooms).toHaveBeenCalledWith(mockRooms);
      expect(mockServer.emit).toHaveBeenCalledWith(SOCKET_EVENT.ROOM_LIST, mockRooms);
    });
  });
});
