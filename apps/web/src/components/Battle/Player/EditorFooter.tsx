import { memo, useMemo } from 'react';

import { useBattleExecutionStore } from '@/stores/battleExecutionStore';

type EditorFooterProps = {
  onDryRun: () => void;
  onSubmit: () => void;
};

function EditorFooter({ onDryRun, onSubmit }: EditorFooterProps) {
  const statusText = useBattleExecutionStore((state) => state.statusText);
  const progress = useBattleExecutionStore((state) => state.progress);
  const isTesting = useBattleExecutionStore((state) => state.isTesting);
  const isSubmitting = useBattleExecutionStore((state) => state.isSubmitting);
  const progressLabel = useMemo(
    () => (progress ? `${progress.passed}/${progress.total}` : '0/0'),
    [progress],
  );
  const isDisabled = isTesting || isSubmitting;

  return (
    <div className="flex items-center justify-between rounded-xl bg-(bg-layer-2) px-4 py-3 text-sm font-semibold">
      <button
        type="button"
        onClick={onDryRun}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-lg bg-green-05 px-3 py-2 text-sm font-semibold text-base-primary transition hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isTesting ? '▶ 실행 중' : '▶ 코드 실행'}
      </button>
      <div className="text-sm text-base-secondary">
        {statusText} · <span className="text-green-05">{progressLabel}</span> 통과
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSubmit}
          disabled={isDisabled}
        >
          {isSubmitting ? '제출 중' : '제출하기'}
        </button>
      </div>
    </div>
  );
}

export default memo(EditorFooter);
