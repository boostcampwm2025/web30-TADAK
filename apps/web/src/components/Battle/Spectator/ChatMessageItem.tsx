import { CHAT_TYPE } from '@shared/constants/chat';
import type { ChatMessage } from '@shared/types/chat';
import { memo } from 'react';

interface ChatMessageItemProps {
  msg: ChatMessage;
  isMine: boolean;
}

const getInitial = (name?: string) => name?.trim().charAt(0)?.toUpperCase() ?? '?';

const getAvatarTone = (isMine: boolean) =>
  isMine ? 'bg-[var(--color-green-04)] text-white' : 'bg-[var(--color-blue-04)] text-white';

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function ChatMessageItem({ msg, isMine }: ChatMessageItemProps) {
  const isSystem = msg.type === CHAT_TYPE.SYSTEM;
  const displayName = isMine ? '나' : msg.nickname;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-[95%] rounded-lg bg-base-muted px-4 py-2 text-center text-xs font-semibold text-base-secondary">
          {msg.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-2 ${isMine ? 'justify-end text-right' : 'justify-start text-left'}`}
    >
      {!isMine && (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold overflow-hidden ${getAvatarTone(false)}`}
        >
          {msg.avatarUrl ? (
            <img src={msg.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            getInitial(displayName)
          )}
        </div>
      )}
      <div className={`max-w-[82%] space-y-1 ${isMine ? 'items-end text-right' : ''}`}>
        <div className={`flex items-center gap-2 text-xs ${isMine ? 'justify-end' : ''}`}>
          {!isMine && <span className="font-semibold text-base-primary">{displayName}</span>}
          <span className="text-[10px] text-base-secondary">{formatTime(msg.timestamp)}</span>
        </div>
        <div
          className={`inline-flex rounded-2xl px-4 py-2 text-sm leading-relaxed ${
            isMine ? 'bg-green-04 text-black-static' : 'bg-base-muted'
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.message}</p>
        </div>
      </div>
      {isMine && (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold overflow-hidden ${getAvatarTone(true)}`}
        >
          {msg.avatarUrl ? (
            <img src={msg.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            getInitial(displayName)
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ChatMessageItem);
