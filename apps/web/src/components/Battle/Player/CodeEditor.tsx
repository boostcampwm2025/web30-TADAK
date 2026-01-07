import { BATTLE_EVENTS } from '@shared/constants/battle';
import { SOCKET_EVENT } from '@shared/constants/socket-event';
import { Code } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { useBattleSocketStore } from '@/stores/battleSocketStore';
import type { Player } from '@/stores/roomStore';
import { useRoomStore } from '@/stores/roomStore';

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

  const handleChange = (value: string) => {
    setCode(value);
    if (!socket?.connected) return;

    socket.emit(BATTLE_EVENTS.CODE_CHANGE, {
      roomId,
      userId: me?.userId ?? socket.id,
      code: value,
      language: 'javascript',
    });
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
        <div className="flex items-center justify-between rounded-xl  bg-(bg-layer-2) px-4 py-3 text-sm font-semibold">
          <button className="inline-flex items-center gap-2 rounded-lg bg-base-muted px-3 py-2 text-xs font-semibold text-base-primary transition hover:brightness-110">
            ▶ 코드 실행
          </button>
          <div className="text-xs text-base-secondary">
            테스트: <span className="text-green-05">0/10</span> 통과
          </div>
          <button className="rounded-lg bg-green-05 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:brightness-110">
            제출하기
          </button>
        </div>
      </section>
    </>
  );
}

export default CodeEditor;
