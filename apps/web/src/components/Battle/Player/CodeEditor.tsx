import type { OnMount } from '@monaco-editor/react';
import { BATTLE_CONFIG, BATTLE_EVENTS, DEFAULT_CODE_TEMPLATE } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@shared/types/pubsub';
import { Code } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { createDryRun, createSubmission } from '@/apis/submission';
import EditorFooter from '@/components/Battle/Player/EditorFooter';
import TestcaseResultPanel from '@/components/Battle/Player/TestcaseResultPanel';
import BaseCodeEditor from '@/components/Common/BaseCodeEditor';
import Toast from '@/components/Common/Toast';
import { useBattleProblemStore } from '@/stores/battleProblemStore';
import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import type { Player } from '@/stores/roomStore';
import { useRoomStore } from '@/stores/roomStore';

type SubmissionProgress = TestcaseUpdateMessage['progress'];
type TestcaseResult = TestcaseUpdateMessage['testcase'] & {
  results?: TestcaseUpdateMessage['results'];
};
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
  const me = useRoomStore((state: { me?: Player }) => state.me);
  const setMe = useRoomStore((state: { setMe: (me: Player) => void }) => state.setMe);
  const isCheatDetectionEnabled = import.meta.env.VITE_CHEAT_DETECTION_ENABLED !== 'false';

  const socket = useBattleSocketStore((state) => state.socket);
  const connect = useBattleSocketStore((state) => state.connect);
  const upsertProgress = useBattleProgressStore((state) => state.upsertProgress);
  const syncProgress = useBattleProgressStore((state) => state.syncProgress);

  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATE);
  const [statusText, setStatusText] = useState('대기 중');
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testcaseResults, setTestcaseResults] = useState<TestcaseResult[]>([]);
  const [mode, setMode] = useState<'TEST' | 'SUBMISSION' | null>(null);
  const [pasteToastMessage, setPasteToastMessage] = useState<string | null>(null);

  const executionRef = useRef<ExecutionState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEditedRef = useRef(false);
  const hasSyncedRef = useRef(false);
  const editorDomRef = useRef<HTMLElement | null>(null);
  const pasteHandlerRef = useRef<((event: ClipboardEvent) => void) | null>(null);
  const lastPasteAtRef = useRef(0);
  const problemId = useBattleProblemStore((state) => state.problem?.id ?? null);
  const battleId = useBattleProblemStore((state) => state.problem?.battleId ?? null);

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

      setTestcaseResults((prev) => {
        const next = prev.filter((item) => item.index !== payload.testcase.index);
        next.push({ ...payload.testcase, results: payload.results });
        next.sort((a, b) => a.index - b.index);
        return next;
      });

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
  }, [me?.userId, roomId, socket, upsertProgress, syncProgress]);

  const handleChange = (value: string) => {
    hasEditedRef.current = true;
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
          ...(battleId ? { battleId } : {}),
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

  const handleEditorMount: OnMount = (editor) => {
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
  };

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
          <BaseCodeEditor
            value={code}
            onChange={(value) => handleChange(value || '')}
            onMount={handleEditorMount}
            options={{
              quickSuggestions: false, // 자동 완성 비활성화
              suggestOnTriggerCharacters: false, // 트리거 문자 입력 시 자동 완성 비활성화
              snippetSuggestions: 'none', // 스니펫 비활성화
              wordBasedSuggestions: 'off', // 단어 기반 제안 비활성화
            }}
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
      {pasteToastMessage && (
        <Toast message={pasteToastMessage} onClose={() => setPasteToastMessage(null)} />
      )}
    </>
  );
}

export default CodeEditor;
