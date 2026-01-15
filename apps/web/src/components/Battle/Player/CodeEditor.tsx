import { BATTLE_CONFIG, BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ProblemDataPayload } from '@shared/types/problem';
import { Code } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { createDryRun, createSubmission } from '@/apis/submission';
import { useBattleSocketStore } from '@/stores/battleSocketStore';
import type { Player } from '@/stores/roomStore';
import { useRoomStore } from '@/stores/roomStore';

type SubmissionProgress = {
  completed: number;
  passed: number;
  total: number;
};

type TestcaseUpdatePayload = {
  submissionId: string | number;
  progress: SubmissionProgress;
  testcase: {
    index: number;
    status: string;
    time: number;
    memory: number;
  };
};

type SubmissionResultPayload = {
  submissionId: string | number;
  status: string;
  result?: {
    passed: number;
    total: number;
    time: number;
    memory: number;
  };
};

type TestcaseResult = {
  index: number;
  status: string;
  time: number;
  memory: number;
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
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | number | null>(null);
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
        submissionIdRef.current = payload.submissionId;
        setActiveSubmissionId(payload.submissionId);
      }
      if (payload.progress) {
        setProgress(payload.progress);
      }
      setTestcaseResults((prev) => {
        const next = prev.filter((item) => item.index !== payload.testcase.index);
        next.push({
          index: payload.testcase.index,
          status: payload.testcase.status,
          time: payload.testcase.time,
          memory: payload.testcase.memory,
        });
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

      submissionIdRef.current = payload.submissionId;
      setActiveSubmissionId(payload.submissionId);
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
    if (!me?.userId) return; // 입장 정보 없으면 전송하지 않음

    socket.emit(BATTLE_EVENTS.CODE_CHANGE, {
      roomId,
      userId: me.userId,
      code: value,
      language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
    });
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

    pendingTypeRef.current = 'TEST';
    submissionIdRef.current = null;
    setIsTesting(true);
    setPendingType('TEST');
    setActiveSubmissionId(null);
    setProgress(null);
    setTestcaseResults([]);
    setStatusText('테스트 요청 중');

    try {
      await createDryRun(
        {
          problemId,
          code,
          language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
        },
        socket.id,
      );
      setStatusText('테스트 대기 중');
    } catch (error) {
      pendingTypeRef.current = null;
      submissionIdRef.current = null;
      setIsTesting(false);
      setPendingType(null);
      setStatusText('테스트 요청 실패');
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (pendingType) return;
    if (!problemId) {
      setStatusText('문제 정보를 불러오는 중입니다');
      return;
    }

    pendingTypeRef.current = 'SUBMISSION';
    submissionIdRef.current = null;
    setIsSubmitting(true);
    setPendingType('SUBMISSION');
    setActiveSubmissionId(null);
    setProgress(null);
    setTestcaseResults([]);
    setStatusText('제출 요청 중');

    try {
      const response = await createSubmission({
        problemId,
        code,
        language: BATTLE_CONFIG.DEFAULT_LANGUAGE,
      });
      if (response?.submissionId !== undefined && response?.submissionId !== null) {
        submissionIdRef.current = response.submissionId;
        setActiveSubmissionId(response.submissionId);
      }
      setStatusText('채점 대기 중');
    } catch (error) {
      pendingTypeRef.current = null;
      submissionIdRef.current = null;
      setIsSubmitting(false);
      setPendingType(null);
      setStatusText('제출 요청 실패');
      console.error(error);
    }
  };

  const progressLabel = progress ? `${progress.passed}/${progress.total}` : '0/0';
  const statusColor = (status: string) => {
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
  };

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-2xl bg-(--bg-layer-2) border border-border-soft text-base-primary xl:h-full xl:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-base-muted bg-(bg-layer-2) px-4 py-2 text-sm font-semibold">
          <div className="flex items-center gap-1.5">
            <Code className="h-5 w-5 text-green-05" strokeWidth={2.5} />
            <span className="rounded pr-3 text-sm font-bold text-green-05">코드 에디터</span>
            <button className="rounded-md bg-base-muted px-3 py-1 text-xs">JavaScript</button>
            {/* <button className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
              Python
            </button>
            <button className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
              Java
            </button>
            <button className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
              C++
            </button> */}
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
              <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                {testcaseResults.map((testcase) => (
                  <div
                    key={testcase.index}
                    className="grid grid-cols-[64px_1fr_72px_72px] items-center gap-2 rounded-md bg-base-primary/5 px-2 py-1 text-[11px]"
                  >
                    <span>TC {testcase.index}</span>
                    <span className={statusColor(testcase.status)}>{testcase.status}</span>
                    <span className="text-right">{testcase.time}ms</span>
                    <span className="text-right">{testcase.memory}MB</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between rounded-xl  bg-(bg-layer-2) px-4 py-3 text-sm font-semibold">
          <button
            type="button"
            onClick={handleDryRun}
            disabled={isTesting || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-base-muted px-3 py-2 text-xs font-semibold text-base-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTesting ? '▶ 실행 중' : '▶ 코드 실행'}
          </button>
          <div className="text-xs text-base-secondary">
            {statusText} · <span className="text-green-05">{progressLabel}</span> 통과
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-green-05 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110"
              onClick={handleSubmit}
              disabled={isTesting || isSubmitting}
            >
              {isSubmitting ? '제출 중' : '제출하기'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default CodeEditor;
