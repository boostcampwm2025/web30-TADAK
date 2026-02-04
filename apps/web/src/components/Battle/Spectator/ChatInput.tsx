import { type KeyboardEventHandler, memo, useState } from 'react';

interface ChatInputProps {
  isLoggedIn: boolean;
  onSend: (message: string) => void;
  onLoginClick: () => void;
}

function ChatInput({ isLoggedIn, onSend, onLoginClick }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!isLoggedIn) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.nativeEvent.isComposing) return;
    if (!isLoggedIn) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border-soft bg-[var(--bg-layer-2)] px-3 py-2">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoggedIn ? '메시지를 입력하세요...' : '로그인 후 채팅을 이용할 수 있어요.'}
        className="chat-scroll h-10 max-h-32 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent text-sm text-base-primary placeholder:text-base-secondary focus:outline-none disabled:cursor-not-allowed"
        disabled={!isLoggedIn}
      />
      {!isLoggedIn && (
        <button
          type="button"
          onClick={onLoginClick}
          className="rounded-lg border border-border-soft px-3 py-2 text-xs font-bold text-base-primary transition hover:bg-base-muted"
        >
          로그인
        </button>
      )}
      <button
        type="button"
        onClick={handleSend}
        className="rounded-lg bg-green-05 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!isLoggedIn || !input.trim()}
      >
        전송
      </button>
    </div>
  );
}

export default memo(ChatInput);
