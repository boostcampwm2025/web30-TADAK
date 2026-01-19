type EditorFooterProps = {
  statusText: string;
  progressLabel: string;
  isTesting: boolean;
  isSubmitting: boolean;
  onDryRun: () => void;
  onSubmit: () => void;
};

function EditorFooter({
  statusText,
  progressLabel,
  isTesting,
  isSubmitting,
  onDryRun,
  onSubmit,
}: EditorFooterProps) {
  const isDisabled = isTesting || isSubmitting;

  return (
    <div className="flex items-center justify-between rounded-xl bg-(bg-layer-2) px-4 py-3 text-sm font-semibold">
      <button
        type="button"
        onClick={onDryRun}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-lg bg-base-muted px-3 py-2 text-xs font-semibold text-base-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isTesting ? '▶ 실행 중' : '▶ 코드 실행'}
      </button>
      <div className="text-xs text-base-secondary">
        {statusText} · <span className="text-green-05">{progressLabel}</span> 통과
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-green-05 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110"
          onClick={onSubmit}
          disabled={isDisabled}
        >
          {isSubmitting ? '제출 중' : '제출하기'}
        </button>
      </div>
    </div>
  );
}

export default EditorFooter;
