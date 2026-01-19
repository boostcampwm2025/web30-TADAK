import { BATTLE_CONFIG, BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import type { FinalResultMessage, TestcaseUpdateMessage } from '@shared/types/pubsub';
import { Code } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { createDryRun, createSubmission } from '@/apis/submission';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import type { Player } from '@/stores/roomStore';
import { useRoomStore } from '@/stores/roomStore';

import EditorFooter from './EditorFooter';
import TestcaseResultPanel from './TestcaseResultPanel';

type SubmissionProgress = TestcaseUpdateMessage['progress'];
type TestcaseResult = TestcaseUpdateMessage['testcase'];
type TestcaseUpdatePayload = Omit<TestcaseUpdateMessage, 'type'>;
type SubmissionResultPayload = Omit<FinalResultMessage, 'type'> & {
  result?: FinalResultMessage['result'];
};

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
  const [problemId, setProblemId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('대기 중');
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'TEST' | 'SUBMISSION' | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testcaseResults, setTestcaseResults] = useState<TestcaseResult[]>([]);

  const pendingTypeRef = useRef(pendingType);
  const submissionIdRef = useRef(activeSubmissionId);

  useEffect(() => {
    pendingTypeRef.current = pendingType;
  }, [pendingType]);

  useEffect(() => {
    submissionIdRef.current = activeSubmissionId;
  }, [activeSubmissionId]);

  useEffect(() => {
    connect();
  }, [connect]);

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

    const handleProblemInfo = (payload: ProblemDataPayload) => {
      if (payload?.id) {
        setProblemId(payload.id);
      }
    };

    const handleTestcaseUpdate = (payload: TestcaseUpdatePayload) => {
      const currentType = pendingTypeRef.current;
      if (!currentType) return;

      const incomingId = String(payload.submissionId);
      const currentId = submissionIdRef.current;
      if (currentId && String(currentId) !== incomingId) return;

      if (!currentId) {
        submissionIdRef.current = String(payload.submissionId);
        setActiveSubmissionId(String(payload.submissionId));
      }
      if (payload.progress) {
        setProgress(payload.progress);
      }
      setTestcaseResults((prev) => {
        const next = prev.filter((item) => item.index !== payload.testcase.index);
        next.push(payload.testcase);
        next.sort((a, b) => a.index - b.index);
        return next;
      });

      setStatusText(currentType === 'TEST' ? '테스트 진행 중' : '채점 진행 중');
    };

    const handleSubmissionResult = (payload: SubmissionResultPayload) => {
      const currentType = pendingTypeRef.current;
      if (!currentType) return;

      const incomingId = String(payload.submissionId);
      const currentId = submissionIdRef.current;
      if (currentId && String(currentId) !== incomingId) return;

      submissionIdRef.current = String(payload.submissionId);
      setActiveSubmissionId(String(payload.submissionId));
      if (payload.result) {
        setProgress({
          passed: payload.result.passed,
          total: payload.result.total,
          completed: payload.result.total,
        });
      }

      const label = currentType === 'TEST' ? '테스트 완료' : '채점 완료';
      setStatusText(`${label} (${payload.status})`);
      pendingTypeRef.current = null;
      setPendingType(null);
      setIsTesting(false);
      setIsSubmitting(false);
    };

    socket.on(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
    socket.on('testcase-update', handleTestcaseUpdate);
    socket.on('submission-result', handleSubmissionResult);

    return () => {
      socket.off(SOCKET_EVENT.PROBLEM_INFO, handleProblemInfo);
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

  const initSubmission = (type: 'TEST' | 'SUBMISSION') => {
    pendingTypeRef.current = type;
    submissionIdRef.current = null;
    setPendingType(type);
    setActiveSubmissionId(null);
    setProgress(null);
    setTestcaseResults([]);

    if (type === 'TEST') {
      setIsTesting(true);
      setStatusText('테스트 요청 중');
    } else {
      setIsSubmitting(true);
      setStatusText('제출 요청 중');
    }
  };

  const resetOnError = (type: 'TEST' | 'SUBMISSION') => {
    pendingTypeRef.current = null;
    submissionIdRef.current = null;
    setPendingType(null);

    if (type === 'TEST') {
      setIsTesting(false);
      setStatusText('테스트 요청 실패');
    } else {
      setIsSubmitting(false);
      setStatusText('제출 요청 실패');
    }
  };

  const handleDryRun = async () => {
    if (pendingType) return;
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
    if (pendingType) return;
    if (!problemId) {
      setStatusText('문제 정보를 불러오는 중입니다');
      return;
    }

    initSubmission('SUBMISSION');

    try {
      const response = await createSubmission({
        problemId,
        code,
        language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
      });
      if (response?.submissionId) {
        submissionIdRef.current = String(response.submissionId);
        setActiveSubmissionId(String(response.submissionId));
      }
      setStatusText('채점 대기 중');
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
            className="h-full min-h-[clamp(260px,50vh,520px)] w-full resize-none rounded-xl bg-(bg-layer-2) border border-base-muted px-4 py-3 text-sm leading-relaxed text-base-primary shadow-inner shadow-slate-950/10 focus:outline-none"
          />
        </div>
        <TestcaseResultPanel progress={progress} testcaseResults={testcaseResults} />
        <EditorFooter
          statusText={statusText}
          progressLabel={progressLabel}
          isTesting={isTesting}
          isSubmitting={isSubmitting}
          onDryRun={handleDryRun}
          onSubmit={handleSubmit}
        />
      </section>
    </>
  );
}

export default CodeEditor;
