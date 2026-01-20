import { BATTLE_CONFIG, BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@shared/types/pubsub';
import { Code } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { createDryRun, createSubmission } from '@/apis/submission';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import type { Player } from '@/stores/roomStore';
import { useRoomStore } from '@/stores/roomStore';

import EditorFooter from './EditorFooter';
import TestcaseResultPanel from './TestcaseResultPanel';

type SubmissionProgress = TestcaseUpdateMessage['progress'];
type TestcaseResult = TestcaseUpdateMessage['testcase'] & {
  results?: TestcaseUpdateMessage['results'];
};
type TestcaseUpdatePayload = Omit<TestcaseUpdateMessage, 'type'> & {
  results?: TestcaseUpdateMessage['results'];
};
type SubmissionResultPayload = Omit<FinalResultMessage, 'type'>;

// 실행 상태 타입
type ExecutionState = {
  type: 'TEST' | 'SUBMISSION';
  submissionId: string | null;
  isCompleted: boolean;
};

// 실행 타임아웃 (60초)
const EXECUTION_TIMEOUT = 60000;

function CodeEditor() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();
  const roomId = roomIdParam ?? searchParams.get('roomId') ?? 'room-unknown';
  const me = useRoomStore((state: { me?: Player }) => state.me);
  const setMe = useRoomStore((state: { setMe: (me: Player) => void }) => state.setMe);

  const socket = useBattleSocketStore((state) => state.socket);
  const connect = useBattleSocketStore((state) => state.connect);

  const [code, setCode] = useState(`function solution() {
  // TODO
}`);
  const [statusText, setStatusText] = useState('대기 중');
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testcaseResults, setTestcaseResults] = useState<TestcaseResult[]>([]);
  const [mode, setMode] = useState<'TEST' | 'SUBMISSION' | null>(null);

  const executionRef = useRef<ExecutionState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const problemId = useBattleProblemStore((state) => state.problem?.id ?? null);

  useEffect(() => {
    pendingTypeRef.current = pendingType;
  }, [pendingType]);

  const clearExecutionTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    return () => {
      clearExecutionTimeout();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStateSync = (payload: {
      roomId: string;
      role: string;
      userId: string;
      username: string;
    }) => {
      if (payload.roomId !== roomId) return;
      setMe({
        roomId: payload.roomId,
        role: payload.role as never,
        userId: payload.userId,
        username: payload.username,
      });
    };

    socket.on(SOCKET_EVENT.ROOM_STATE_ROLE, handleStateSync);
    return () => {
      socket.off(SOCKET_EVENT.ROOM_STATE_ROLE, handleStateSync);
    };
  }, [roomId, setMe, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleTestcaseUpdate = (payload: TestcaseUpdatePayload) => {
      const execution = executionRef.current;
      // 실행 중이 아니거나 이미 완료된 경우 무시
      if (!execution || execution.isCompleted) return;

      const incomingId = String(payload.submissionId);

      if (!execution.submissionId) {
        execution.submissionId = incomingId;
      } else if (execution.submissionId !== incomingId) {
        return;
      }

      if (!execution.submissionId) {
        execution.submissionId = incomingId;
      }

      if (payload.progress) {
        setProgress(payload.progress);
      }

      setTestcaseResults((prev) => {
        const next = prev.filter((item) => item.index !== payload.testcase.index);
        next.push({ ...payload.testcase, results: payload.results });
        next.sort((a, b) => a.index - b.index);
        return next;
      });

      setStatusText(execution.type === 'TEST' ? '테스트 진행 중' : '채점 진행 중');
    };

    const handleSubmissionResult = (payload: SubmissionResultPayload) => {
      const execution = executionRef.current;
      // 실행 중이 아니면 무시
      if (!execution) return;

      const incomingId = String(payload.submissionId);

      if (!execution.submissionId) {
        execution.submissionId = incomingId;
      } else if (execution.submissionId !== incomingId) {
        return;
      }

      // 타임아웃 정리
      clearExecutionTimeout();

      execution.isCompleted = true;

      if (payload.result) {
        setProgress({
          passed: payload.result.passed,
          total: payload.result.total,
          completed: payload.result.total,
        });
      }

      const label = execution.type === 'TEST' ? '테스트 완료' : '채점 완료';
      setStatusText(`${label} (${payload.status})`);

      executionRef.current = null;
      if (execution.type === 'TEST') {
        setIsTesting(false);
      } else {
        setIsSubmitting(false);
      }
    };

    socket.on('testcase-update', handleTestcaseUpdate);
    socket.on('submission-result', handleSubmissionResult);

    return () => {
      socket.off('testcase-update', handleTestcaseUpdate);
      socket.off('submission-result', handleSubmissionResult);
    };
  }, [socket]);

  const handleChange = (value: string) => {
    setCode(value);
    if (!socket?.connected) return;
    if (!me?.userId) return;

    socket.emit(BATTLE_EVENTS.CODE_CHANGE, {
      roomId,
      userId: me.userId,
      code: value,
      language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
    });
  };

  const resetExecution = (type: 'TEST' | 'SUBMISSION', statusMessage: string) => {
    clearExecutionTimeout();
    executionRef.current = null;

    if (type === 'TEST') {
      setIsTesting(false);
    } else {
      setIsSubmitting(false);
    }
    setStatusText(statusMessage);
  };

  const initSubmission = (type: 'TEST' | 'SUBMISSION', submissionId?: string) => {
    // 이전 타임아웃 정리
    clearExecutionTimeout();

    executionRef.current = {
      type,
      submissionId: submissionId ?? null,
      isCompleted: false,
    };
    setProgress(null);
    setTestcaseResults([]);

    if (type === 'TEST') {
      setIsTesting(true);
      setMode('TEST');
      setStatusText('테스트 요청 중');
    } else {
      setIsSubmitting(true);
      setMode('SUBMISSION');
      setStatusText('제출 요청 중');
    }

    // 타임아웃 설정
    timeoutRef.current = setTimeout(() => {
      const execution = executionRef.current;
      if (execution && !execution.isCompleted) {
        resetExecution(execution.type, '시간 초과 - 결과를 받지 못했습니다');
      }
    }, EXECUTION_TIMEOUT);
  };

  const resetOnError = (type: 'TEST' | 'SUBMISSION') => {
    resetExecution(type, type === 'TEST' ? '테스트 요청 실패' : '제출 요청 실패');
    setMode(null);
  };

  const handleDryRun = async () => {
    // 이미 실행 중이면 무시
    if (executionRef.current) return;
    if (!socket?.connected || !socket.id) {
      setStatusText('소켓 연결이 필요합니다');
      return;
    }
    if (!problemId) {
      setStatusText('문제 정보를 불러오는 중입니다');
      return;
    }

    initSubmission('TEST');

    try {
      await createDryRun({ problemId, code, language: BATTLE_CONFIG.DEFAULT_LANGUAGE }, socket.id);
      setStatusText('테스트 대기 중');
    } catch (error) {
      resetOnError('TEST');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    // 이미 실행 중이면 무시
    if (executionRef.current) return;
    if (!socket?.connected || !socket.id) {
      setStatusText('소켓 연결이 필요합니다');
      return;
    }
    if (!problemId) {
      setStatusText('문제 정보를 불러오는 중입니다');
      return;
    }

    initSubmission('SUBMISSION');

    try {
      const response = await createSubmission(
        {
          problemId,
          code,
          language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
        },
        socket.id,
      );
      if (response?.submissionId) {
        initSubmission('SUBMISSION', String(response.submissionId));
        setStatusText('채점 대기 중');
      }
    } catch (error) {
      resetOnError('SUBMISSION');
      console.error(error);
    }
  };

  const progressLabel = progress ? `${progress.passed}/${progress.total}` : '0/0';

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-2xl bg-(--bg-layer-2) border border-border-soft text-base-primary xl:h-full xl:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-base-muted bg-(bg-layer-2) px-4 py-2 text-sm font-semibold">
          <div className="flex items-center gap-1.5">
            <Code className="h-5 w-5 text-green-05" strokeWidth={2.5} />
            <span className="rounded pr-3 text-sm font-bold text-green-05">코드 에디터</span>
            <button className="rounded-md bg-base-muted px-3 py-1 text-xs">JavaScript</button>
          </div>
        </div>
        <div className="min-h-0 bg-(bg-layer-2) px-5 py-4 font-mono text-sm text-base-primary xl:flex-1">
          <textarea
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            className="h-full min-h-60 flex-1 w-full resize-none rounded-xl bg-(bg-layer-2) border border-base-muted px-4 py-3 text-sm leading-relaxed text-base-primary shadow-inner shadow-slate-950/10 focus:outline-none"
          />
        </div>
        <EditorFooter
          statusText={statusText}
          progressLabel={progressLabel}
          isTesting={isTesting}
          isSubmitting={isSubmitting}
          onDryRun={handleDryRun}
          onSubmit={handleSubmit}
        />
        <TestcaseResultPanel testcaseResults={testcaseResults} mode={mode} />
      </section>
    </>
  );
}

export default CodeEditor;
