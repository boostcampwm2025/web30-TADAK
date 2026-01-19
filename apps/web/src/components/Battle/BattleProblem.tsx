import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import { AlertTriangle, BookOpen, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useBattleSocketStore } from '@/stores/battleSocketStore';

const EMPTY_CONSTRAINTS: Array<{ category: string; text: string }> = [];
const EMPTY_EXAMPLES: Array<{ label: string; input: string; output: string }> = [];

function BattleProblem() {
  const connect = useBattleSocketStore((state) => state.connect);
  const [problem, setProblem] = useState<ProblemDataPayload | null>(null);

  useEffect(() => {
    const socket = connect();
    const handleProblemInfo = (payload: ProblemDataPayload) => {
      if (payload.id && payload.title) {
        setProblem(payload);
      }
    };

    socket.on(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
    return () => {
      socket.off(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
    };
  }, [connect]);

  const constraintItems = useMemo(() => {
    if (!problem) return EMPTY_CONSTRAINTS;
    const items = [
      { category: '시간 제한', text: `${problem.timeLimit}초` },
      { category: '메모리 제한', text: `${problem.memoryLimit}MB` },
      { category: '난이도', text: problem.difficulty },
    ];
    return items.filter((item) => item.text.trim().length > 0);
  }, [problem]);

  const exampleItems = useMemo(() => {
    if (!problem?.examples?.length) return EMPTY_EXAMPLES;
    return problem.examples.map((ex, index) => ({
      label: `예제 ${index + 1}`,
      input: ex.input,
      output: ex.output,
    }));
  }, [problem]);

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-(--bg-layer-2) border border-border-soft p-5 text-base-primary xl:h-full xl:min-h-0 xl:overflow-y-auto">
      <div className="flex items-start justify-between">
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-base-primary">
            {problem?.title ?? '두 수의 합 찾기'}
          </h1>
          {problem?.statement ? (
            <p className="text-base text-base-secondary">{problem.statement}</p>
          ) : (
            <p className="text-base text-base-secondary">
              정수 배열과 목표 값이 주어졌을 때, 두 수의 인덱스를 반환하시오.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">문제 설명</p>
        </div>
        {problem?.statement ? (
          <div className="whitespace-pre-wrap rounded-md bg-base-primary/5 p-3 text-sm">
            {problem.statement}
          </div>
        ) : (
          <div className="rounded-md bg-base-primary/5 p-3 text-sm text-base-secondary">
            문제 설명을 불러오는 중입니다.
          </div>
        )}
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">예제</p>
        </div>
        <div className="space-y-3">
          {exampleItems.length > 0 ? (
            exampleItems.map((ex) => (
              <div key={ex.label} className="space-y-2 rounded-md bg-base-primary/5 p-3 text-sm">
                <p className="text-sm font-bold text-base-secondary">{ex.label}</p>
                <p className="text-sm">
                  입력: <span className="text-green-05">{ex.input}</span>
                </p>
                <p className="text-sm">
                  출력: <span className="text-green-05">{ex.output}</span>
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-md bg-base-primary/5 p-3 text-sm text-base-secondary">
              예제 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">제약 조건</p>
        </div>
        {constraintItems.length > 0 ? (
          <ul className="space-y-2 pl-2">
            {constraintItems.map((line) => (
              <li key={line.text} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-base-primary" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-base-secondary">{line.category}</span>
                  <span>{line.text}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-md bg-base-primary/5 p-3 text-sm text-base-secondary">
            제약 조건 정보를 불러오는 중입니다.
          </div>
        )}
      </div>
    </section>
  );
}

export default BattleProblem;
