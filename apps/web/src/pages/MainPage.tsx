import { ROOM_CONFIG } from '@shared/constants/socket-event';
import type { UserRole } from '@shared/types/user';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      <header className="mb-2 flex items-center gap-3 border-b border-soft bg-white px-10 py-6 shadow-sm">
        <div className="grid h-12 w-12 rounded-2xl bg-brand shadow-lg"></div>
        <div className="flex flex-col">
          <span className="text-lg font-extrabold tracking-tight logo-gradient">CODE RENA</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 pt-10 px-10 pb-16 bg-surface">
        <div className="flex items-start gap-3">
          <div className="h-10 w-1 rounded-full bg-brand" />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">대결 로비</h1>
            <p className="text-sm text-slate-600">실시간 코딩 대결에 참여하세요</p>
          </div>
        </div>

        <div className="relative flex-1">
          <div className="rounded-2xl border border-soft bg-white px-12 py-16 text-center shadow-sm">
            <button
              type="button"
              onClick={handleStartBattle}
              className="rounded-2xl bg-cta-main px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              배틀 시작하기
            </button>
          </div>
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
