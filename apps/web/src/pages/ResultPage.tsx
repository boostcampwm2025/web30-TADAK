import { Home } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/Common/Button';
import Header from '@/components/Header/Header';
import CodeViewer from '@/components/Result/CodeViewer';
import PlayerCard from '@/components/Result/PlayerCard';
import ResultHeader from '@/components/Result/ResultHeader';

function ResultPage() {
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);

  // TODO: 실제 데이터로 교체
  const mockData = {
    battle: {
      id: 'battle-123',
      winnerId: 'user1',
    },
    participants: [
      {
        userId: 'user1',
        username: 'CodeMaster',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeMaster',
        tier: 'Gold' as const,
        rate: 1450,
        score: 10,
        totalScore: 10,
        time: '8:30',
        code: `function test() {
        console.log('test');
        test1
        test1
        test1
        test1
        test1
        test1
        test1
        test1
        test1 
        test1
        test1 
        }`,
      },
      {
        userId: 'user2',
        username: 'AlgoKing',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoKing',
        tier: 'Gold' as const,
        rate: 1420,
        score: 5,
        totalScore: 10,
        time: '8:30',
        code: `test2`,
      },
    ],
  };

  const { battle, participants } = mockData;
  const selectedPlayer = participants[selectedPlayerIndex];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-3 pt-4 lg:px-8">
        <ResultHeader />

        <div className="flex gap-6 h-112">
          <div className="flex w-105 shrink-0 flex-col gap-4">
            {participants.map((participant, index) => (
              <PlayerCard
                key={participant.userId}
                player={participant}
                rank={index + 1}
                isWinner={participant.userId === battle.winnerId}
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
              isWinner={selectedPlayer.userId === battle.winnerId}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="muted"
            icon={Home}
            iconSize={20}
            onClick={() => (window.location.href = '/')}
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
