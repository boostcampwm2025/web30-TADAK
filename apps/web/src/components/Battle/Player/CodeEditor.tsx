import type { OnMount } from '@monaco-editor/react';
import { BATTLE_CONFIG, BATTLE_EVENTS, DEFAULT_CODE_TEMPLATE } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@shared/types/pubsub';
import { Code } from 'lucide-react';
import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import { createDryRun, createSubmission } from '@/apis/submission';
import EditorFooter from '@/components/Battle/Player/EditorFooter';
import TestcaseResultPanel from '@/components/Battle/Player/TestcaseResultPanel';
import Toast from '@/components/Common/Toast';
import { useBattleExecutionStore } from '@/stores/battleExecutionStore';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import type { Player } from '@/stores/roomStore';
import { useRoomStore } from '@/stores/roomStore';

const LazyBaseCodeEditor = lazy(() => import('@/components/Common/BaseCodeEditor'));

type EditorPaneProps = {
  code: string;
  onCodeChange: (value: string) => void;
  onMount: OnMount;
};

const EditorPane = memo(function EditorPane({ code, onCodeChange, onMount }: EditorPaneProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">에디터를 불러오는 중...</div>
      }
    >
      <LazyBaseCodeEditor
        value={code}
        onChange={(nextValue) => {
          const normalized = nextValue || '';
          onCodeChange(normalized);
        }}
        onMount={onMount}
        options={{
          quickSuggestions: false, // 자동 완성 비활성화
          suggestOnTriggerCharacters: false, // 트리거 문자 입력 시 자동 완성 비활성화
          snippetSuggestions: 'none', // 스니펫 비활성화
          wordBasedSuggestions: 'off', // 단어 기반 제안 비활성화
        }}
      />
    </Suspense>
  );
});

type TestcaseUpdatePayload = Omit<TestcaseUpdateMessage, 'type'> & {
  results?: TestcaseUpdateMessage['results'];
};
type SubmissionResultPayload = Omit<FinalResultMessage, 'type' | 'status'> & {
  userId?: string;
  status: FinalResultMessage['status'] | 'SYNC';
};

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
  const { me, setMe } = useRoomStore(
    useShallow((state: { me?: Player; setMe: (me: Player) => void }) => ({
      me: state.me,
      setMe: state.setMe,
    })),
  );
  const isCheatDetectionEnabled = import.meta.env.VITE_CHEAT_DETECTION_ENABLED !== 'false';

  const { socket, connect } = useBattleSocketStore(
    useShallow((state) => ({
      socket: state.socket,
      connect: state.connect,
    })),
  );
  const { upsertProgress, syncProgress } = useBattleProgressStore(
    useShallow((state) => ({
      upsertProgress: state.upsertProgress,
      syncProgress: state.syncProgress,
    })),
  );

  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATE);
  const codeRef = useRef(code);
  const [pasteToastMessage, setPasteToastMessage] = useState<string | null>(null);

  const executionRef = useRef<ExecutionState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEditedRef = useRef(false);
  const hasSyncedRef = useRef(false);
  const editorDomRef = useRef<HTMLElement | null>(null);
  const pasteHandlerRef = useRef<((event: ClipboardEvent) => void) | null>(null);
  const lastPasteAtRef = useRef(0);
  const { problemId, battleId } = useBattleProblemStore(
    useShallow((state) => ({
      problemId: state.problem?.id ?? null,
      battleId: state.problem?.battleId ?? null,
    })),
  );
  const {
    setStatusText,
    setProgress,
    setIsTesting,
    setIsSubmitting,
    setMode,
    setTestcaseResults,
    upsertTestcaseResult,
  } = useBattleExecutionStore(
    useShallow((state) => ({
      setStatusText: state.setStatusText,
      setProgress: state.setProgress,
      setIsTesting: state.setIsTesting,
      setIsSubmitting: state.setIsSubmitting,
      setMode: state.setMode,
      setTestcaseResults: state.setTestcaseResults,
      upsertTestcaseResult: state.upsertTestcaseResult,
    })),
  );

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
      const dom = editorDomRef.current;
      const handler = pasteHandlerRef.current;
      if (dom && handler) {
        dom.removeEventListener('paste', handler, true);
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStateSync = (payload: {
      roomId: string;
      role: string;
      userId: string;
      username: string;
      avatarUrl?: string;
    }) => {
      if (payload.roomId !== roomId) return;
      setMe({
        roomId: payload.roomId,
        role: payload.role as never,
        userId: payload.userId,
        username: payload.username,
        avatarUrl: payload.avatarUrl,
      });
    };

    socket.on(SOCKET_EVENT.ROOM_STATE_ROLE, handleStateSync);
    return () => {
      socket.off(SOCKET_EVENT.ROOM_STATE_ROLE, handleStateSync);
    };
  }, [roomId, setMe, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdated = (payload: {
      roomId: string;
      userId: string;
      code: string;
      language: string;
    }) => {
      if (payload.roomId !== roomId) return;
      if (!me?.userId || payload.userId !== me.userId) return;
      if (hasEditedRef.current || hasSyncedRef.current) return;
      const incomingCode = typeof payload.code === 'string' ? payload.code : '';
      if (incomingCode.trim().length > 0) {
        setCode(incomingCode);
        codeRef.current = incomingCode;
      }
      hasSyncedRef.current = true;
    };

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

      upsertTestcaseResult({ ...payload.testcase, results: payload.results });

      setStatusText(execution.type === 'TEST' ? '테스트 진행 중' : '채점 진행 중');
    };

    const handleSubmissionResult = (payload: SubmissionResultPayload) => {
      // 모든 플레이어의 제출 결과를 store에 저장 (ProgressBar용)
      if (payload.userId && payload.result) {
        // SYNC 이벤트는 재접속 시 진행률 동기화용이므로 activity log 추가하지 않음
        if (payload.status === 'SYNC') {
          syncProgress(payload.userId, {
            passed: payload.result.passed,
            total: payload.result.total,
          });
        } else {
          upsertProgress(payload.userId, {
            passed: payload.result.passed,
            total: payload.result.total,
          });
        }
      }

      const execution = executionRef.current;
      // 본인의 실행 중이 아니면 UI 업데이트 스킵
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

    socket.on(BATTLE_EVENTS.CODE_UPDATED, handleCodeUpdated);
    socket.on('testcase-update', handleTestcaseUpdate);
    socket.on('submission-result', handleSubmissionResult);

    return () => {
      socket.off(BATTLE_EVENTS.CODE_UPDATED, handleCodeUpdated);
      socket.off('testcase-update', handleTestcaseUpdate);
      socket.off('submission-result', handleSubmissionResult);
    };
  }, [
    me?.userId,
    roomId,
    socket,
    upsertProgress,
    syncProgress,
    setProgress,
    setStatusText,
    setIsSubmitting,
    setIsTesting,
    upsertTestcaseResult,
  ]);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      codeRef.current = value;
      hasEditedRef.current = true;
      if (!socket?.connected) return;
      if (!me?.userId) return;

      socket.emit(BATTLE_EVENTS.CODE_CHANGE, {
        roomId,
        userId: me.userId,
        code: value,
        language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
      });
    },
    [me, roomId, socket],
  );

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

  const handleDryRun = useCallback(async () => {
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
      await createDryRun(
        { problemId, code: codeRef.current, language: BATTLE_CONFIG.DEFAULT_LANGUAGE },
        socket.id,
      );
      setStatusText('테스트 대기 중');
    } catch (error) {
      resetOnError('TEST');
      console.error(error);
    }
  }, [battleId, initSubmission, problemId, resetOnError, setStatusText, socket]);

  const handleSubmit = useCallback(async () => {
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
          code: codeRef.current,
          language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
          ...(battleId ? { battleId } : {}),
        },
        socket.id,
      );
      if (response?.submissionId) {
        setStatusText('채점 대기 중');
      }
    } catch (error) {
      resetOnError('SUBMISSION');
      console.error(error);
    }
  }, [battleId, initSubmission, problemId, resetOnError, setStatusText, socket]);

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      const domNode = editor.getDomNode();
      if (!domNode) return;

      editorDomRef.current = domNode;
      const handlePaste = (event: ClipboardEvent) => {
        if (!isCheatDetectionEnabled) return;
        event.preventDefault();
        event.stopPropagation();
        const now = Date.now();
        if (now - lastPasteAtRef.current < 1000) return;
        lastPasteAtRef.current = now;
        setPasteToastMessage('외부 코드 붙여넣기는 금지되어 있습니다! 🚫');

        const activeSocket = socket ?? connect();
        if (activeSocket?.connected && isCheatDetectionEnabled) {
          activeSocket.emit(SOCKET_EVENT.CHEAT_WARNING, { roomId, type: 'PASTE' });
        }
      };

      pasteHandlerRef.current = handlePaste;
      domNode.addEventListener('paste', handlePaste, true);
    },
    [connect, isCheatDetectionEnabled, roomId, socket],
  );

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
        <div className="min-h-[320px] h-[40vh] bg-(bg-layer-2) font-mono text-sm text-base-primary xl:h-auto xl:flex-1">
          <EditorPane code={code} onCodeChange={handleCodeChange} onMount={handleEditorMount} />
        </div>
        <EditorFooter onDryRun={handleDryRun} onSubmit={handleSubmit} />
        <TestcaseResultPanel />
      </section>
      {pasteToastMessage && (
        <Toast message={pasteToastMessage} onClose={() => setPasteToastMessage(null)} />
      )}
    </>
  );
}

export default memo(CodeEditor);
