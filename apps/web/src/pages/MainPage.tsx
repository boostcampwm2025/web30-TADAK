import { ROOM_CONFIG } from '@shared/constants/socket-event';
import type { UserRole } from '@shared/types/user';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/Header/header';

import { JoinModal } from '../components/JoinModal';
import { useBattleSocketStore } from '../stores/battleSocketStore';

const DEFAULT_ROOM_ID = '1';

function MainPage() {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('player');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const connect = useBattleSocketStore((state) => state.connect);
  const requestRoomAvailability = useBattleSocketStore((state) => state.requestRoomAvailability);
  const roomAvailability = useBattleSocketStore((state) => state.roomAvailability);
  const joinRoom = useBattleSocketStore((state) => state.joinRoom);
  const subscribeRoomAvailability = useBattleSocketStore(
    (state) => state.subscribeRoomAvailability,
  );
  const unsubscribeRoomAvailability = useBattleSocketStore(
    (state) => state.unsubscribeRoomAvailability,
  );

  const handleCloseModal = () => {
    setModalOpen(false);
    setJoinError('');
    setIsJoining(false);
    unsubscribeRoomAvailability();
  };

  const participants = {
    count: roomAvailability?.playerCount ?? 0,
    limit: ROOM_CONFIG.MAX_PLAYERS,
  };
  const spectators = {
    count: 0,
    limit: Infinity,
  };

  const handleStartBattle = () => {
    setJoinError('');
    connect();
    requestRoomAvailability({ roomId: DEFAULT_ROOM_ID }).catch((error) => {
      setJoinError(error instanceof Error ? error.message : '인원 정보를 불러오지 못했습니다.');
    });
    subscribeRoomAvailability(DEFAULT_ROOM_ID);
    setModalOpen(true);
  };

  const handleJoinRoom = async () => {
    setJoinError('');
    setIsJoining(true);
    try {
      const response = await joinRoom({ roomId: DEFAULT_ROOM_ID, requestedRole: selectedRole });
      const role = response.role ?? selectedRole;
      const search = role === 'spectator' ? '?mode=spectator' : '';
      setModalOpen(false);
      navigate(`/room/${response.roomId}${search}`);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : '입장에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsJoining(false);
    }
  };

  // useEffect(() => {
  //   return () => {
  //     disconnect();
  //   };
  // }, [disconnect]);

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
      </main>

      <JoinModal
        open={isModalOpen}
        onClose={handleCloseModal}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
        onJoin={handleJoinRoom}
        joining={isJoining}
        error={joinError}
        participants={participants}
        spectators={spectators}
      />
    </div>
  );
}

export default MainPage;
