import { Github } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Header from '@/components/Header/header';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleGithubLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    window.location.href = `${API_BASE_URL}/auth/github`;
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-bg-layer-1">
      <Header />
      <div className="flex flex-col items-center justify-center pt-32">
        <div className="w-full max-w-md rounded-24 border border-border-soft bg-bg-layer-2 p-8 shadow-xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-ink">로그인</h1>
          <button
            onClick={handleGithubLogin}
            className="flex w-full items-center justify-center gap-3 rounded-24 bg-black py-4 text-white transition hover:bg-black/80 active:scale-[0.98]"
          >
            <Github size={24} />
            <span className="text-lg font-medium">GitHub로 계속하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
