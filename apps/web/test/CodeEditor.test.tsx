import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CodeEditor from '../src/components/Battle/Player/CodeEditor';

// Mock child components to isolate CodeEditor logic
vi.mock('@/components/Common/BaseCodeEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <textarea
      data-testid="base-code-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('@/components/Battle/Player/EditorFooter', () => ({
  default: ({ onDryRun, onSubmit }: { onDryRun: () => void; onSubmit: () => void }) => (
    <div data-testid="editor-footer">
      <button onClick={onDryRun}>Run</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

vi.mock('@/components/Battle/Player/TestcaseResultPanel', () => ({
  default: () => <div data-testid="testcase-result-panel" />,
}));

vi.mock('@/components/Common/Toast', () => ({
  default: () => <div data-testid="toast" />,
}));

const { socketHandlers, testcaseResults, mockSocketEmit } = vi.hoisted(() => {
  const socketHandlers: Record<string, (...args: any[]) => void> = {};
  const testcaseResults: any[] = [];
  const mockSocketEmit = vi.fn();
  return { socketHandlers, testcaseResults, mockSocketEmit };
});

const mockConnect = vi.fn();

vi.mock('@/stores/battleSocketStore', () => ({
  useBattleSocketStore: () => ({
    socket: {
      connected: true,
      emit: mockSocketEmit,
      on: (event: string, fn: (...args: any[]) => void) => {
        socketHandlers[event] = fn;
      },
      off: vi.fn(),
      id: 'socket-id',
    },
    connect: mockConnect,
  }),
}));

vi.mock('@shared/constants/battle', () => ({
  BATTLE_CONFIG: { DEFAULT_LANGUAGE: 'javascript' },
  BATTLE_EVENTS: { CODE_CHANGE: 'code-change', CODE_UPDATED: 'code-updated' },
  DEFAULT_CODE_TEMPLATE: 'const code = "";',
}));

vi.mock('@shared/constants/socket-event', () => ({
  SOCKET_EVENT: {
    ROOM_STATE_ROLE: 'room-state-role',
    CHEAT_WARNING: 'cheat-warning',
  },
}));

vi.mock('@/stores/roomStore', () => ({
  useRoomStore: () => ({
    me: { userId: 'user-1', roomId: 'room-1' },
    setMe: vi.fn(),
  }),
}));

vi.mock('@/stores/battleProblemStore', () => ({
  useBattleProblemStore: () => ({
    problemId: 'problem-1',
    battleId: 'battle-1',
  }),
}));

vi.mock('@/stores/battleExecutionStore', () => {
  function useBattleExecutionStore() {
    return {
      setStatusText: vi.fn(),
      setProgress: vi.fn(),
      setIsTesting: vi.fn(),
      setIsSubmitting: vi.fn(),
      setMode: vi.fn(),
      setTestcaseResults: vi.fn(),
      upsertTestcaseResult: (result: any) => {
        testcaseResults.push(result);
      },
    };
  }
  useBattleExecutionStore.getState = () => ({ testcaseResults });
  return { useBattleExecutionStore };
});

vi.mock('@/stores/battleProgressStore', () => ({
  useBattleProgressStore: () => ({
    upsertProgress: vi.fn(),
    syncProgress: vi.fn(),
  }),
}));

// Mock APIs
const mockCreateDryRun = vi.fn();
const mockCreateSubmission = vi.fn();

vi.mock('@/apis/submission', () => ({
  createDryRun: (...args: any[]) => mockCreateDryRun(...args),
  createSubmission: (...args: any[]) => mockCreateSubmission(...args),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ roomId: 'room-1' }),
  useSearchParams: () => [new URLSearchParams()],
}));

describe('CodeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testcaseResults.length = 0;
    Object.keys(socketHandlers).forEach((key) => delete socketHandlers[key]);
  });

  it('컴포넌트가 올바르게 렌더링되어야 한다', async () => {
    render(<CodeEditor />);
    expect(await screen.findByTestId('base-code-editor')).toBeInTheDocument();
    expect(await screen.findByTestId('editor-footer')).toBeInTheDocument();
  });

  it('키 입력 시 상태가 업데이트되고 소켓 이벤트가 전송되어야 한다', async () => {
    render(<CodeEditor />);
    const editor = await screen.findByTestId('base-code-editor');

    fireEvent.change(editor, { target: { value: 'console.log("hello");' } });

    expect(editor).toHaveValue('console.log("hello");');
    expect(mockSocketEmit).toHaveBeenCalledWith('code-change', {
      roomId: 'room-1',
      userId: 'user-1',
      code: 'console.log("hello");',
      language: 'javascript',
    });
  });

  it('제출 시 최신 코드 상태로 요청이 전송되어야 한다', async () => {
    render(<CodeEditor />);
    const editor = await screen.findByTestId('base-code-editor');
    const submitButton = await screen.findByText('Submit');

    fireEvent.change(editor, { target: { value: 'const a = 1;' } });

    await waitFor(() => {
      expect(editor).toHaveValue('const a = 1;');
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'const a = 1;',
        }),
        'socket-id',
      );
    });
  });

  it('테스트 실행 시 최신 코드 상태로 요청이 전송되어야 한다', async () => {
    render(<CodeEditor />);
    const editor = await screen.findByTestId('base-code-editor');
    const runButton = await screen.findByText('Run');

    fireEvent.change(editor, { target: { value: 'console.log("test");' } });

    await waitFor(() => {
      expect(editor).toHaveValue('console.log("test");');
    });

    fireEvent.click(runButton);

    await waitFor(() => {
      expect(mockCreateDryRun).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'console.log("test");',
        }),
        'socket-id',
      );
    });
  });
});

describe('테스트케이스 수신 완료 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testcaseResults.length = 0;
    Object.keys(socketHandlers).forEach((key) => delete socketHandlers[key]);
    mockCreateDryRun.mockResolvedValue({});
  });

  it('FINAL_RESULT가 마지막 TC보다 먼저 도착해도 TC 누락 없이 3개 모두 처리된다', async () => {
    render(<CodeEditor />);
    const runButton = await screen.findByText('Run');

    // 코드 실행 시작 → executionRef 초기화
    fireEvent.click(runButton);
    await waitFor(() => expect(mockCreateDryRun).toHaveBeenCalled());

    const submissionId = 'sub-1';

    // TC1, TC2 정상 수신
    socketHandlers['testcase-update']?.({
      submissionId,
      testcase: { index: 1, status: 'WRONG_ANSWER' },
      results: [],
    });
    socketHandlers['testcase-update']?.({
      submissionId,
      testcase: { index: 2, status: 'WRONG_ANSWER' },
      results: [],
    });

    // FINAL_RESULT가 TC3보다 먼저 도착 (순서 역전)
    socketHandlers['submission-result']?.({
      submissionId,
      result: { passed: 1, total: 3 },
      status: 'WRONG_ANSWER',
    });

    // TC3 늦게 도착
    await new Promise((resolve) => setTimeout(resolve, 50));
    socketHandlers['testcase-update']?.({
      submissionId,
      testcase: { index: 3, status: 'ACCEPTED' },
      results: [],
    });

    await waitFor(() => {
      expect(testcaseResults).toHaveLength(3);
    });
  });

  it('정상 순서(TC1→TC2→TC3→FINAL_RESULT)에서도 3개 모두 처리된다', async () => {
    render(<CodeEditor />);
    const runButton = await screen.findByText('Run');

    fireEvent.click(runButton);
    await waitFor(() => expect(mockCreateDryRun).toHaveBeenCalled());

    const submissionId = 'sub-1';

    socketHandlers['testcase-update']?.({
      submissionId,
      testcase: { index: 1, status: 'WRONG_ANSWER' },
      results: [],
    });
    socketHandlers['testcase-update']?.({
      submissionId,
      testcase: { index: 2, status: 'WRONG_ANSWER' },
      results: [],
    });
    socketHandlers['testcase-update']?.({
      submissionId,
      testcase: { index: 3, status: 'ACCEPTED' },
      results: [],
    });
    socketHandlers['submission-result']?.({
      submissionId,
      result: { passed: 1, total: 3 },
      status: 'WRONG_ANSWER',
    });

    await waitFor(() => {
      expect(testcaseResults).toHaveLength(3);
    });
  });
});
