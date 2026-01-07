import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-layer-1 text-ink">
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="rounded-full bg-base-muted p-4">
          <AlertTriangle size={48} className="text-brand" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">로그인이 만료되었습니다</h1>
          <p className="text-ink-subtle">보안을 위해 다시 로그인해 주세요.</p>
        </div>

        <button
          onClick={() => navigate('/login', { replace: true })}
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:brightness-110 active:scale-95"
        >
          로그인 페이지로 이동
        </button>
      </div>
    </div>
  );
}
