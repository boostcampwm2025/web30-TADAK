import { CHAT_TYPE } from '@shared/constants/chat';
import type { ChatMessage } from '@shared/types/chat';
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
      <section className="relative flex h-full min-h-90 sm:min-h-130 max-h-[calc(100vh-200px)] max-lg:max-h-none flex-col gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">실시간 채팅</p>
          <span className="text-[11px] font-semibold text-emerald-300">관전 모드</span>
        </div>
        <div className="chat-scroll flex-1 min-h-0 space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          {messages.map((msg, index) => {
            const key = `${msg.timestamp}-${index}`;
            const isSystem = msg.type === CHAT_TYPE.SYSTEM;
            const isMine = msg.isMine ?? msg.nickname === nickname;
            const displayName = isMine ? '나' : msg.nickname;

            if (isSystem) {
              return (
                <div key={key} className="flex justify-center">
                  <div className="w-full max-w-[90%] rounded-lg bg-slate-800/70 px-3 py-2 text-center text-xs font-semibold text-amber-200">
                    <span className="mr-1 text-amber-300">System:</span>
                    <span className="text-amber-100">{msg.message}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] space-y-1 rounded-lg border p-3 text-xs bg-red ${
                    isMine
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-50'
                      : 'border-slate-800 bg-slate-900/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span
                      className={`font-semibold ${isMine ? 'text-emerald-200' : 'text-spectator-icon'}`}
                    >
                      {displayName}
                    </span>
                    <span
                      className={`text-[9px] ${isMine ? 'text-emerald-200/80' : 'text-slate-400'}`}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="sticky bottom-0 left-0 right-0 flex items-end gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="chat-scroll h-10 max-h-32 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
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
