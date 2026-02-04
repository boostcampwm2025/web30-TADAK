import { SOCKET_EVENT } from '@shared/constants/socket-event';
import type { ChatMessage } from '@shared/types/chat';
import { MessagesSquare } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useBattleSocketStore } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';
import { useUserStore } from '@/stores/userStore';

import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';

const initialMessages: ChatMessage[] = [];

function ChatSpectator() {
  const { roomId = '1' } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const me = useRoomStore((state) => state.me);
  const user = useUserStore((state) => state.user);
  const socket = useBattleSocketStore((state) => state.socket);
  const connectSocket = useBattleSocketStore((state) => state.connect);

  const roomIdRef = useRef(roomId);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    roomIdRef.current = roomId;
    navigateRef.current = navigate;
  }, [roomId, navigate]);

  const myNickname = useMemo(() => {
    const fallback = socket?.id ? `User-${socket.id.slice(-4)}` : '관전자';
    return me?.username ?? fallback;
  }, [me, socket]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const isLoggedIn = useMemo(() => Boolean(user?.id), [user?.id]);

  useEffect(() => {
    const activeSocket = socket ?? connectSocket();
    if (!activeSocket) return;

    const handleReceiveChat = (msg: ChatMessage) => {
      const currentMe = useRoomStore.getState().me;
      const currentSocket = useBattleSocketStore.getState().socket;
      const currentNickname =
        currentMe?.username ??
        (currentSocket?.id ? `User-${currentSocket.id.slice(-4)}` : '관전자');

      setMessages((prev) => [...prev, { ...msg, isMine: msg.nickname === currentNickname }]);
    };

    activeSocket.on(SOCKET_EVENT.RECEIVE_CHAT, handleReceiveChat);

    return () => {
      activeSocket.off(SOCKET_EVENT.RECEIVE_CHAT, handleReceiveChat);
    };
  }, [socket, connectSocket]);

  const handleSend = useCallback((message: string) => {
    const activeSocket =
      useBattleSocketStore.getState().socket ?? useBattleSocketStore.getState().connect();
    const currentMe = useRoomStore.getState().me;
    const currentSocket = useBattleSocketStore.getState().socket;
    const currentNickname =
      currentMe?.username ?? (currentSocket?.id ? `User-${currentSocket.id.slice(-4)}` : '관전자');
    const currentAvatar = currentMe?.avatarUrl;

    activeSocket?.emit(SOCKET_EVENT.SEND_CHAT, {
      roomId: roomIdRef.current,
      message,
      nickname: currentNickname,
      avatarUrl: currentAvatar,
    });
  }, []);

  const handleLoginClick = useCallback(() => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) {
      useBattleSocketStore.getState().leaveRoom(currentRoomId);
    }
    try {
      sessionStorage.removeItem('battle-session');
    } catch {
      // ignore
    }
    navigateRef.current('/login', { replace: true });
  }, []);

  return (
    <section className="relative flex h-full min-h-[60vh] max-h-[70vh] sm:max-h-[60vh] xl:max-h-none flex-col overflow-hidden rounded-2xl border border-border-soft bg-[var(--bg-layer-2)] text-base-primary shadow-sm">
      <div className="flex items-center justify-between border-b border-border-soft bg-[var(--bg-layer-2)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full">
            <MessagesSquare className="h-5 w-5 text-green-05 stroke-[2.5]" />
          </div>
          <p className="text-md font-semibold">실시간 채팅</p>
        </div>
      </div>
      <ChatMessageList messages={messages} myNickname={myNickname} />
      <ChatInput isLoggedIn={isLoggedIn} onSend={handleSend} onLoginClick={handleLoginClick} />
    </section>
  );
}

export default memo(ChatSpectator);
