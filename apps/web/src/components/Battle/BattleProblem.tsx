function BattleProblem() {
  const constraints = ['-10^4 <= target <= 10^4', '정확히 하나의 유효한 답이 존재합니다'];

  const hints = ['해시맵을 사용하면 O(n) 시간 복잡도로 해결할 수 있습니다.'];
  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/40 xl:h-full xl:min-h-0 xl:overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="rounded-full bg-amber-300 px-3 py-1 text-amber-900">Gold</span>
          <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-emerald-200">구현</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-200">두 수의 합 찾기</p>
          <h2 className="text-2xl font-bold text-white">
            정수 배열과 목표 값이 주어졌을 때, 두 수의 인덱스를 반환하시오.
          </h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-200">
          <p className="font-semibold text-emerald-200">문제 설명</p>
          <p>
            정수로 이루어진 배열 <span className="font-semibold text-emerald-300">nums</span> 와
            정수 <span className="font-semibold text-emerald-300">target</span> 이 주어집니다.
            배열에서 두 수를 선택하여 더했을 때 target이 되는 두 수의 인덱스를 배열로 반환하세요.
          </p>
          <p>각 입력에는 정확히 하나의 해답만 존재하며, 같은 원소를 두 번 사용할 수 없습니다.</p>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-sm font-semibold text-emerald-200">예제</p>
          <div className="space-y-2 rounded-lg bg-slate-800/60 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">예제 1</p>
            <p className="text-slate-200">입력: nums = [2,7,11,15], target = 9</p>
            <p className="text-emerald-300">출력: [0,1]</p>
            <p className="text-slate-400">설명: nums[0] + nums[1] = 2 + 7 = 9</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-emerald-200">제약 조건</p>
          <ul className="space-y-1">
            {constraints.map((line) => (
              <li key={line} className="flex items-start gap-2 text-slate-200">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-emerald-400" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-emerald-200">힌트</p>
          <ul className="space-y-1">
            {hints.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-emerald-300" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export default BattleProblem;
