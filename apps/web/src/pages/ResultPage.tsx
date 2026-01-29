import type { BattleResultResponse } from '@shared/types/battle';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getBattleResult } from '@/apis/battle';
import Button from '@/components/Common/Button';
import Header from '@/components/Header/Header';
import CodeViewer from '@/components/Result/CodeViewer';
import PlayerCard from '@/components/Result/PlayerCard';
import ResultHeader from '@/components/Result/ResultHeader';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useMatchingStore } from '@/stores/matchingStore';
import { useRoomStore } from '@/stores/roomStore';

function ResultPage() {
  const navigate = useNavigate();
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);

  const { battleId } = useParams<{ battleId: string }>();
  const [battleData, setBattleData] = useState<BattleResultResponse | null>(null);

  const clearMatching = useMatchingStore((state) => state.cleanup);
  const clearProblem = useBattleProblemStore((state) => state.clearProblem);
  const clearRoom = useRoomStore((state) => state.clearRoom);

  useEffect(() => {
    if (!battleId) return;

    getBattleResult(battleId)
      .then((data) => {
        setBattleData(data);
      })
      .catch((err) => {
        console.error('배틀 결과 조회 실패:', err);
      });
  }, [battleId]);

  // 페이지 이탈 시(unmount) 모든 배틀 상태 초기화
  useEffect(() => {
    return () => {
      clearMatching();
      clearProblem();
      clearRoom();
      sessionStorage.removeItem('battle-session');
    };
  }, [clearMatching, clearProblem, clearRoom]);

  const handleGoHome = () => {
    // navigate 호출 시 컴포넌트가 unmount 되면서 위 useEffect의 cleanup 함수가 실행된다.
    navigate('/');
  };

  if (!battleData) {
    return null;
  }

  const { battle, players } = battleData;
  const selectedPlayer = players[selectedPlayerIndex];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-3 pt-4 lg:px-8">
        <ResultHeader />

        <div className="flex gap-6 h-112">
          <div className="flex w-105 shrink-0 flex-col gap-4">
            {players.map((player, index) => (
              <PlayerCard
                key={player.userId}
                player={player}
                rank={index + 1}
                isWinner={player.userId === battle.winnerId}
                isSelected={selectedPlayerIndex === index}
                onClick={() => setSelectedPlayerIndex(index)}
              />
            ))}
          </div>

          <div className="flex-1">
            <CodeViewer
              username={selectedPlayer.username}
              avatarUrl={selectedPlayer.avatarUrl}
              code={selectedPlayer.code}
              result={
                !battle.winnerId
                  ? 'draw'
                  : selectedPlayer.userId === battle.winnerId
                    ? 'win'
                    : 'lose'
              }
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="muted"
            icon={Home}
            iconSize={20}
            onClick={handleGoHome}
            className="gap-2 px-6 py-3 shadow-md"
          >
            홈으로
          </Button>
        </div>
      </main>
    </div>
  );
}

export default ResultPage;
