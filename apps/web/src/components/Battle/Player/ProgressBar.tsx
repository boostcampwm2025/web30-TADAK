function ProgressBar() {
  return (
    <div className="flex w-full flex-row gap-5">
      <div className="flex min-w-55 flex-1 items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-base-primary">
          <span className="h-2 w-2 rounded-full bg-color-green-05" />
          You
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-base-muted">
          <span className="absolute left-0 top-0 h-full w-[12%] bg-color-green-05" />
          <span className="absolute left-0 top-0 h-full w-full bg-[rgba(34,197,94,0.2)]" />
          <span className="absolute left-0 top-0 h-full w-[60%] bg-color-green-05" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-base-primary">
          <span>0%</span>
        </div>
      </div>

      <div className="flex min-w-55 flex-1 items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-base-primary">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-05 text-[10px] font-bold text-white">
            C
          </div>
        </div>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-base-muted">
          <span className="absolute left-0 top-0 h-full w-[12%] bg-color-green-05" />
          <span className="absolute left-0 top-0 h-full w-full bg-[rgba(244,63,94,0.2)]" />
          <span className="absolute left-0 top-0 h-full w-[60%] bg-pink-05" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-pink-05">
          <span>0%</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
