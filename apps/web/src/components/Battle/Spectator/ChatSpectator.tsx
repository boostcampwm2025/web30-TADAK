import { CHAT_TYPE } from '@shared/constants/chat';
import type { ChatMessage } from '@shared/types/chat';
import { MessagesSquare } from 'lucide-react';
import { type KeyboardEventHandler, useEffect, useMemo, useRef, useState } from 'react';

const initialMessages: ChatMessage[] = [
  {
    type: CHAT_TYPE.USER,
    nickname: 'CodeFan123',
    message: 'CodeMaster 화이팅!',
    timestamp: new Date().toISOString(),
  },
  {
    type: CHAT_TYPE.USER,
    nickname: 'AlgoLover',
    message: '이 문제 어렵네요 ㄷㄷ',
    timestamp: new Date().toISOString(),
  },
  {
    type: CHAT_TYPE.USER,
    nickname: 'DevWatcher',
    message: 'AlgoKing 진행도 빠르다',
    timestamp: new Date().toISOString(),
  },
  {
    type: CHAT_TYPE.SYSTEM,
    nickname: 'System',
    message: 'CodeMaster님이 테스트를 통과했습니다!',
    timestamp: new Date().toISOString(),
  },
];

function ChatSpectator() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const nickname = useMemo(() => '나', []);

  useEffect(() => {
    // 새 메시지가 추가되면 리스트 하단으로 스크롤
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [messages.length]);

  const getInitial = (name?: string) => name?.trim().charAt(0)?.toUpperCase() ?? '?';

  const getAvatarTone = (isMine: boolean) =>
    isMine ? 'bg-green-04 text-white' : 'bg-blue-04 text-white';

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const outgoing: ChatMessage = {
      type: CHAT_TYPE.USER,
      nickname,
      message: trimmed,
      timestamp: new Date().toISOString(),
      isMine: true,
    };

    setMessages((prev) => [...prev, outgoing]);
    setInput('');
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.nativeEvent.isComposing) return; // IME 조합 중일 때는 전송하지 않음
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <section className="relative flex h-full min-h-90 sm:min-h-130 max-h-[calc(100vh-200px)] max-lg:max-h-none flex-col overflow-hidden rounded-2xl border border-border-soft bg-(--bg-layer-2) text-base-primary shadow-sm">
        <div className="flex items-center justify-between border-b border-border-soft bg-(--bg-layer-2) px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full">
              <MessagesSquare className="h-5 w-5 text-green-05 stroke-[2.5]" />
            </div>
            <p className="text-md font-semibold">실시간 채팅</p>
          </div>
        </div>
        <div className="chat-scroll flex-1 min-h-0 space-y-3 overflow-y-auto bg-(--bg-layer-2) px-4 py-4">
          <div className="flex justify-center">
            <div className="w-full max-w-[95%] rounded-lg bg-base-muted px-4 py-2 text-center text-xs font-semibold text-base-secondary">
              관전 모드에 오신 것을 환영합니다!
            </div>
          </div>
          {messages.map((msg, index) => {
            const key = `${msg.timestamp}-${index}`;
            const isSystem = msg.type === CHAT_TYPE.SYSTEM;
            const isMine = msg.isMine ?? msg.nickname === nickname;
            const displayName = isMine ? '나' : msg.nickname;

            if (isSystem) {
              return (
                <div key={key} className="flex justify-center">
                  <div className="w-full max-w-[95%] rounded-lg bg-base-muted px-4 py-2 text-center text-xs font-semibold text-base-secondary">
                    {msg.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={key}
                className={`flex items-start gap-2 ${isMine ? 'justify-end text-right' : 'justify-start text-left'}`}
              >
                {!isMine && (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${getAvatarTone(false)}`}
                  >
                    {getInitial(displayName)}
                  </div>
                )}
                <div className={`max-w-[82%] space-y-1 ${isMine ? 'items-end text-right' : ''}`}>
                  <div className={`flex items-center gap-2 text-xs ${isMine ? 'justify-end' : ''}`}>
                    {!isMine && (
                      <span className="font-semibold text-base-primary">{displayName}</span>
                    )}
                    <span className="text-[10px] text-base-secondary">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`inline-flex rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                      isMine ? 'bg-green-02 text-black' : 'bg-base-muted text-base-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
                {isMine && (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${getAvatarTone(true)}`}
                  >
                    {getInitial(displayName)}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-end gap-2 border-t border-border-soft bg-(--bg-layer-2) px-3 py-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="chat-scroll h-10 max-h-32 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent text-sm text-base-primary placeholder:text-base-secondary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-lg bg-green-05 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!input.trim()}
          >
            전송
          </button>
        </div>
      </section>
    </>
  );
}

export default ChatSpectator;
