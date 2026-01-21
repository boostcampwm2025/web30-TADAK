import BaseCodeEditor from '@/components/Common/BaseCodeEditor';

interface CodeViewerProps {
  username: string;
  avatarUrl: string;
  code: string;
  isWinner: boolean;
}

function CodeViewer({ username, avatarUrl, code, isWinner }: CodeViewerProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl shadow-lg overflow-hidden bg-bg-layer-2 border border-border-soft">
      <div
        className={`flex items-center border-b border-border-soft px-4 py-3 gap-3 ${
          isWinner ? 'bg-green-03' : 'bg-pink-03'
        }`}
      >
        <div className="h-8 w-8 overflow-hidden rounded-full bg-white">
          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
        </div>
        <span className="font-semibold text-black-static">{username}</span>
        <span className="ml-auto text-sm font-semibold text-black-static">
          {isWinner ? '승리' : '패배'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <BaseCodeEditor
          value={code}
          options={{
            readOnly: true,
            renderLineHighlight: 'none',
            contextmenu: false,
            folding: false,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>
    </div>
  );
}

export default CodeViewer;
