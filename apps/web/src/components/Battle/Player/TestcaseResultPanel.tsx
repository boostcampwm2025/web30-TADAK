import type { TestcaseStatus, TestcaseUpdateMessage } from '@shared/types/pubsub';
import { useEffect, useRef } from 'react';

type SubmissionProgress = TestcaseUpdateMessage['progress'];
type TestcaseResult = TestcaseUpdateMessage['testcase'] & {
  results?: TestcaseUpdateMessage['results'];
};

type TestcaseResultPanelProps = {
  progress: SubmissionProgress | null;
  testcaseResults: TestcaseResult[];
  mode?: 'TEST' | 'SUBMISSION' | null;
};

function getStatusColor(status: TestcaseStatus) {
  switch (status) {
    case 'ACCEPTED':
      return 'text-green-05';
    case 'WRONG_ANSWER':
      return 'text-pink-05';
    case 'TIME_LIMIT_EXCEEDED':
    case 'MEMORY_LIMIT_EXCEEDED':
    case 'RUNTIME_ERROR':
    case 'COMPILE_ERROR':
    case 'INTERNAL_ERROR':
      return 'text-orange-05';
    default:
      return 'text-base-secondary';
  }
}

function TestcaseResultPanel({ progress, testcaseResults, mode }: TestcaseResultPanelProps) {
  const progressLabel = progress ? `${progress.passed}/${progress.total}` : '0/0';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [testcaseResults]);

  return (
    <div className="border-t border-base-muted bg-(bg-layer-2) px-4 py-3 text-xs">
      <div className="mb-2 flex items-center justify-between text-base-secondary">
        <span>테스트케이스 결과</span>
        <span>{progressLabel} 통과</span>
      </div>
      {testcaseResults.length === 0 ? (
        <div className="rounded-md bg-base-primary/5 px-3 py-2 text-xs text-base-secondary">
          아직 수신된 결과가 없습니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[64px_1fr_72px_72px] gap-2 px-2 pb-1 text-[11px] text-base-secondary">
            <span>케이스</span>
            <span>결과</span>
            <span className="text-right">시간</span>
            <span className="text-right">메모리</span>
          </div>
          <div ref={scrollRef} className="max-h-36 space-y-1 overflow-y-auto pr-1">
            {testcaseResults.map((testcase) => (
              <div
                key={testcase.index}
                className="space-y-1 rounded-md bg-base-primary/5 px-2 py-1.5 text-[11px]"
              >
                <div className="grid grid-cols-[64px_1fr_72px_72px] items-center gap-2">
                  <span>TC {testcase.index}</span>
                  <span className={getStatusColor(testcase.status)}>{testcase.status}</span>
                  <span className="text-right">{testcase.time}ms</span>
                  <span className="text-right">{testcase.memory}MB</span>
                </div>

                {mode === 'TEST' && testcase.results && (
                  <div className="mt-2 space-y-1.5 text-[11px]">
                    <div className="grid grid-cols-[64px_1fr] items-start gap-2">
                      <div className="text-base-secondary">입력</div>
                      <div className="rounded-md bg-base-primary/5 px-2 py-1 font-mono text-base-primary whitespace-pre-wrap break-all">
                        {testcase.results.input}
                      </div>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-start gap-2">
                      <div className="text-base-secondary">예상 출력</div>
                      <div className="rounded-md bg-base-primary/5 px-2 py-1 font-mono text-base-primary whitespace-pre-wrap break-all">
                        {testcase.results.expectedOutput}
                      </div>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-start gap-2">
                      <div className="text-base-secondary">실제 출력</div>
                      <div className="rounded-md bg-base-primary/5 px-2 py-1 font-mono text-base-primary whitespace-pre-wrap break-all">
                        {testcase.results.output}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TestcaseResultPanel;
