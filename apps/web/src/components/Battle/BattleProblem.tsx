import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import { AlertTriangle, BookOpen, FileText, Link } from 'lucide-react';
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

  const tags = useMemo(() => {
    if (!problem?.tags) return [];
    if (Array.isArray(problem.tags)) return problem.tags;
    return problem.tags
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((tag) => tag.replace(/['"]/g, '').trim())
      .filter(Boolean);
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-base-primary">{problem?.title}</h1>
            {problem?.url && (
              <a
                href={problem.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border-soft px-2 py-1 text-xs text-base-secondary transition hover:text-base-primary"
              >
                <Link className="h-3.5 w-3.5" />
                원문
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-base-secondary">
            <span>{problem?.source}</span>
            <span className="text-base-muted">·</span>
            <span>{problem?.difficulty}</span>
            <span className="text-base-muted">·</span>
            <span>{problem?.timeLimit}s</span>
            <span className="text-base-muted">/</span>
            <span>{problem?.memoryLimit}MB</span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-base-primary/10 px-2 py-1 text-base-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">문제 설명</p>
        </div>
        <div className="whitespace-pre-wrap rounded-md bg-base-primary/5 p-3 text-sm">
          {problem?.statement}
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">입출력</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-md bg-base-primary/5 p-3 text-sm">
            <p className="text-sm font-bold text-base-secondary">입력</p>
            <p className="whitespace-pre-wrap">{problem?.input}</p>
          </div>
          <div className="space-y-2 rounded-md bg-base-primary/5 p-3 text-sm">
            <p className="text-sm font-bold text-base-secondary">출력</p>
            <p className="whitespace-pre-wrap">{problem?.output}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-base-primary">
        <div className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-green-05" strokeWidth={3} />
          <p className="font-bold text-green-05">예제</p>
        </div>
        <div className="space-y-3">
          {exampleItems.map((ex) => (
            <div key={ex.label} className="space-y-2 rounded-md bg-base-primary/5 p-3 text-sm">
              <p className="text-sm font-bold text-base-secondary">{ex.label}</p>
              <p className="text-sm">
                입력: <span className="text-green-05">{ex.input}</span>
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
      </div>

      {problem?.note && (
        <div className="space-y-3 text-sm leading-relaxed text-base-primary">
          <div className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-green-05" strokeWidth={3} />
            <p className="font-bold text-green-05">노트</p>
          </div>
          <div className="whitespace-pre-wrap rounded-md bg-base-primary/5 p-3 text-sm">
            {problem.note}
          </div>
        </div>
      )}
    </section>
  );
}

export default BattleProblem;
