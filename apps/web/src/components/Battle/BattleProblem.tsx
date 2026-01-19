import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import { AlertTriangle, BookOpen, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useBattleSocketStore } from '@/stores/battleSocketStore';

const constraints = [
  { category: '배열 길이', text: '2 ≤ nums.length ≤ 10⁴' },
  { category: '원소 범위', text: '-10⁹ ≤ nums[i] ≤ 10⁹' },
  { category: '목표 범위', text: '-10⁹ ≤ target ≤ 10⁹' },
  { category: '정답', text: '정확히 하나의 유효한 답이 존재합니다' },
];

const examples = [
  { label: '예제 1', input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
  { label: '예제 2', input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
];

function BattleProblem() {
  const connect = useBattleSocketStore((state) => state.connect);
  const [, setProblemId] = useState<string | null>(null);

  useEffect(() => {
    const socket = connect();
    const handleProblemInfo = (payload: ProblemDataPayload) => {
      if (payload?.id) {
        setProblemId(payload.id);
      }
    };

    socket.on(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
    return () => {
      socket.off(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
    };
  }, [connect]);

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-(--bg-layer-2) border border-border-soft p-5 text-base-primary xl:h-full xl:min-h-0 xl:overflow-y-auto">
      <div className="flex items-start justify-between">
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-base-primary">두 수의 합 찾기</h1>
          <p className="text-base text-base-secondary">
            정수 배열과 목표 값이 주어졌을 때, 두 수의 인덱스를 반환하시오.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">문제 설명</p>
        </div>
        <div className="space-y-3 rounded-md bg-base-primary/5 p-3 text-sm">
          <p>
            정수로 이루어진 배열 <span className="font-semibold text-green-05">nums</span> 와 정수{' '}
            <span className="font-semibold text-green-05">target</span> 이 주어집니다.
          </p>
          <p>
            배열에서 두 수를 선택하여 더했을 때{' '}
            <span className="font-semibold text-green-05">target</span> 이 되는 두 수의 인덱스를
            배열로 반환하세요.
          </p>
          <p>각 입력에는 정확히 하나의 해답만 존재하며, 같은 원소를 두 번 사용할 수 없습니다.</p>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">예제</p>
        </div>
        <div className="space-y-3">
          {examples.map((ex) => (
            <div key={ex.label} className="space-y-2 rounded-md bg-base-primary/5 p-3 text-sm">
              <p className="text-sm font-bold text-base-secondary">{ex.label}</p>
              <p className="text-sm">
                입력: nums = <span className="text-green-05">{ex.input.match(/\[.*\]/)?.[0]}</span>,
                target = <span className="text-green-05">{ex.input.split('target = ')[1]}</span>
              </p>
              <p className="text-sm">
                출력: <span className="text-green-05">{ex.output}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">제약 조건</p>
        </div>
        <ul className="space-y-2 pl-2">
          {constraints.map((line) => (
            <li key={line.text} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-base-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-base-secondary">{line.category}</span>
                <span>{line.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default BattleProblem;
