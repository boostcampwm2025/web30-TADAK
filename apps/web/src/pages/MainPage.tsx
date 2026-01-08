import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/Header/Header';

function MainPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleStartBattle = () => {
    navigate('/matching');
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
      </main>
    </div>
  );
}

export default MainPage;
