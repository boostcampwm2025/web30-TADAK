import { Clock } from 'lucide-react';

interface Props {
  onContinue: () => void;
  onCancel: () => void;
}

export default function WaitConfirmModal({ onContinue, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl bg-base-faint p-8 shadow-2xl text-base-primary select-none">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-05/20">
            <Clock className="h-8 w-8 text-green-05" />
          </div>
        </div>

        <h3 className="mb-2 text-center text-xl font-bold">매칭 지연</h3>

        <p className="mb-8 text-center text-base leading-relaxed">
          매칭 시간이 길어지고 있습니다.
          <br />
          계속 대기하시겠습니까?
        </p>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-base-muted px-6 py-3 font-semibold transition hover:scale-105 active:scale-95"
          >
            매칭 취소
          </button>
          <button
            onClick={onContinue}
            className="flex-1 rounded-lg bg-green-05 px-6 py-3 font-semibold transition hover:scale-105 active:scale-95"
          >
            계속 대기
          </button>
        </div>
      </div>
    </div>
  );
}
