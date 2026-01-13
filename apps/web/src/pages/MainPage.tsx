import { SOCKET_EVENT } from '@shared/constants/socket-event';
import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/Header/Header';
import Modal from '@/components/ui/Modal';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useUserStore } from '@/stores/userStore';

type RoomSummary = {
  roomId: string;
  title: string;
  status: 'waiting' | 'in-battle';
};

function MainPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const connect = useBattleSocketStore((state) => state.connect);
  const socket = useBattleSocketStore((state) => state.socket);
  const joinRoom = useBattleSocketStore((state) => state.joinRoom);
  const startMatching = useMatchingStore((state) => state.startMatching);
  const registerMatchingListeners = useMatchingStore((state) => state.registerMatchingListeners);
  const [activeRooms, setActiveRooms] = useState<RoomSummary[]>([]);
  const [isLoadingRooms, setLoadingRooms] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    const activeSocket = socket ?? connect();
    if (!activeSocket.connected) {
      activeSocket.connect();
    }
    setLoadingRooms(true);

    const handleRoomList = (rooms: RoomSummary[]) => {
      setActiveRooms(rooms);
      setLoadingRooms(false);
    };

    activeSocket.on(SOCKET_EVENT.ROOM_LIST, handleRoomList);
    activeSocket.emit(SOCKET_EVENT.ROOM_LIST_REQUEST);

    return () => {
      activeSocket.off(SOCKET_EVENT.ROOM_LIST, handleRoomList);
    };
  }, [socket, connect]);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleStartBattle = async () => {
    if (!user?.id) {
      setShowLoginModal(true);
      return;
    }

    try {
      const socket = connect();

      // Socket이 연결될 때까지 대기
      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          socket.once('connect', () => resolve());
        });
      }

      if (!socket.id) {
        throw new Error('Socket ID를 받지 못했습니다.');
      }

      registerMatchingListeners(socket);

      await startMatching(user.id, socket.id);

      navigate('/matching');
    } catch (error) {
      console.error('매칭 시작 중 오류:', error);
    }
  };

  const handleJoinSpectator = async (roomId: string) => {
    setJoiningRoomId(roomId);
    try {
      const socket = connect();
      if (!socket.connected) {
        await new Promise<void>((resolve) => socket.once('connect', () => resolve()));
      }
      await joinRoom({
        roomId,
        requestedRole: 'spectator',
        userId: user?.id,
        username: user?.username,
        avatarUrl: user?.avatarUrl,
      });
      navigate(`/room/${roomId}?mode=spectator`);
    } catch (error) {
      console.error('관전 입장 실패:', error);
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 pt-10 px-10 pb-16">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-01" />
            <h1 className="text-3xl font-bold">LIVE</h1>
            <h1 className="text-3xl font-bold text-brand">BATTLE</h1>
            <button
              type="button"
              onClick={handleStartBattle}
              className="ml-auto rounded-24 bg-brand px-8 py-4 text-lg font-semibold shadow-md transition hover:scale-[1.02]"
            >
              자동 매칭
            </button>
          </div>
          <p className="text-sm text-base-primary">
            현재 진행 중인 배틀을 관전하고 고수들의 코딩을 배워보세요
          </p>
        </div>

        <div className="rounded-2xl border border-base-secondary bg-base-secondary/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-05" />
              <h2 className="text-xl font-semibold">관전 가능한 방</h2>
            </div>
            {isLoadingRooms && <span className="text-sm text-base-faint">불러오는 중...</span>}
          </div>
          {activeRooms.length === 0 ? (
            <p className="text-sm text-base-faint">진행 중인 배틀이 없습니다.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between rounded-xl border border-base-secondary bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{room.title}</p>
                    <p className="text-xs text-base-faint">
                      {room.status === 'in-battle' ? '진행 중' : '대기 중'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoinSpectator(room.roomId)}
                    className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-60"
                    disabled={joiningRoomId === room.roomId}
                  >
                    {joiningRoomId === room.roomId ? '입장 중...' : '관전하기'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        icon={LogIn}
        title="로그인이 필요합니다"
        description="배틀을 시작하려면 로그인이 필요합니다"
        buttons={[
          {
            label: '취소',
            onClick: () => setShowLoginModal(false),
            variant: 'muted',
          },
          {
            label: '로그인하기',
            onClick: () => navigate('/login'),
            variant: 'green',
          },
        ]}
      />
    </div>
  );
}

export default MainPage;
