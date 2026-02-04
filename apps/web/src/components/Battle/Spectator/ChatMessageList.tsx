import type { ChatMessage } from '@shared/types/chat';
import { memo, useEffect, useRef } from 'react';

import ChatMessageItem from './ChatMessageItem';

interface ChatMessageListProps {
  messages: ChatMessage[];
  myNickname: string;
}

function ChatMessageList({ messages, myNickname }: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (list) {
        list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }, [messages.length]);

  return (
    <div
      ref={listRef}
      className="chat-scroll flex-1 min-h-0 space-y-3 overflow-y-auto bg-[var(--bg-layer-2)] px-4 py-4 pb-16"
    >
      <div className="flex justify-center">
        <div className="w-full max-w-[95%] rounded-lg bg-base-muted px-4 py-2 text-center text-xs font-semibold text-base-secondary">
          관전 모드에 오신 것을 환영합니다!
        </div>
      </div>
      {messages.map((msg, index) => {
        const key = `${msg.timestamp}-${index}`;
        const isMine = msg.isMine ?? msg.nickname === myNickname;

        return <ChatMessageItem key={key} msg={msg} isMine={isMine} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default memo(ChatMessageList);
