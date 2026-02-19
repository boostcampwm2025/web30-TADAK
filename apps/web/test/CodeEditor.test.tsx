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

// Mock stores
const mockSocketEmit = vi.fn();
const mockConnect = vi.fn();

vi.mock('@/stores/battleSocketStore', () => ({
  useBattleSocketStore: () => ({
    socket: { connected: true, emit: mockSocketEmit, on: vi.fn(), off: vi.fn(), id: 'socket-id' },
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

const mockSetStatusText = vi.fn();
vi.mock('@/stores/battleExecutionStore', () => ({
  useBattleExecutionStore: () => ({
    setStatusText: mockSetStatusText,
    setProgress: vi.fn(),
    setIsTesting: vi.fn(),
    setIsSubmitting: vi.fn(),
    setMode: vi.fn(),
    setTestcaseResults: vi.fn(),
    upsertTestcaseResult: vi.fn(),
  }),
}));

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
