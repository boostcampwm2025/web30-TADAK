import { Code } from 'lucide-react';
import { lazy, memo, Suspense, useMemo } from 'react';

import { useBattleProgressStore } from '@/stores/battleProgressStore';
import { useRoomStore } from '@/stores/roomStore';

const BaseCodeEditor = lazy(() => import('@/components/Common/BaseCodeEditor'));

type Participant = {
  userId: string;
  username: string;
};

type CodeSpectatorEditorProps = {
  activeSelectedId: string | null;
  participants: Participant[];
};

function CodeSpectatorEditor({ activeSelectedId, participants }: CodeSpectatorEditorProps) {
  const selectedProgress = useBattleProgressStore((state) =>
    activeSelectedId ? state.progresses[activeSelectedId] : null,
  );
  const rawSelectedCode = useRoomStore((state) =>
    activeSelectedId ? state.codes[activeSelectedId] : undefined,
  );

  const selectedCode = useMemo(() => {
    const isCodeEmpty = !rawSelectedCode || rawSelectedCode.trim().length === 0;
    return isCodeEmpty ? '아직 입력된 코드가 없어요 🙂' : rawSelectedCode;
  }, [rawSelectedCode]);

  const selectedName =
    participants.find((p) => p.userId === activeSelectedId)?.username ?? '관전자';

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-(bg-layer-2) text-base-primary shadow-inner shadow-slate-950/10 xl:flex-1 xl:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft bg-(--bg-layer-2) px-4 py-3 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-green-05" strokeWidth={2.5} />
          <span className="rounded pr-3 text-sm font-bold text-green-05">코드 에디터</span>
          <span className="text-color-green-05">{selectedName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-base-secondary">
          <span className="rounded-full bg-base-muted px-3 py-1 text-base-primary">JavaScript</span>
        </div>
      </div>

      <div className="min-h-[520px] h-[40vh] bg-(bg-layer-2) font-mono text-sm text-base-primary xl:h-auto xl:flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">에디터를 불러오는 중...</div>
          }
        >
          <BaseCodeEditor
            value={selectedCode}
            options={{
              readOnly: true,
              renderLineHighlight: 'none',
              contextmenu: false,
              folding: false,
              hideCursorInOverviewRuler: true,
            }}
          />
        </Suspense>
      </div>
      <div className="flex items-center justify-end gap-4 border-t border-border-soft bg-(--bg-layer-2) px-4 py-3 text-xs text-base-secondary">
        <span className="flex items-center gap-1 text-green-05">
          ● {selectedProgress?.passed ?? 0}개 테스트 통과
        </span>
        <span className="flex items-center gap-1 text-pink-05">
          ● {(selectedProgress?.total ?? 0) - (selectedProgress?.passed ?? 0)}개 실패
        </span>
      </div>
    </div>
  );
}

export default memo(CodeSpectatorEditor);
