interface CodeViewerProps {
  username: string;
  avatarUrl: string;
  code: string;
  isWinner: boolean;
  language?: string;
}

function CodeViewer({ username, avatarUrl, code, isWinner }: CodeViewerProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl shadow-lg overflow-hidden bg-bg-layer-2 border border-border-soft">
      <div
        className={`flex items-center border-b border-border-soft px-4 py-3 gap-3 ${
          isWinner ? 'bg-green-05' : 'bg-pink-05'
        }`}
      >
        <div className="h-8 w-8 overflow-hidden rounded-full bg-white">
          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
        </div>
        <span className="font-semibold text-base-primary">{username}</span>
        <span className="ml-auto text-sm font-semibold">{isWinner ? '승리' : '패배'}</span>
      </div>

      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-base-secondary/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-base-secondary/50 active:[&::-webkit-scrollbar-thumb]:bg-base-secondary/60">
        <div className="inline-flex min-w-full min-h-full">
          <div className="shrink-0 w-12 bg-bg-layer-1/30 px-3 py-4 h-auto min-h-full">
            <pre className="text-sm">
              {code.split('\n').map((_, idx) => (
                <div key={idx} className="text-right select-none text-base-secondary leading-6">
                  {idx + 1}
                </div>
              ))}
            </pre>
          </div>

          <div className="flex-1 bg-white px-4 py-4">
            <pre className="text-sm">
              <code>
                {code.split('\n').map((line, idx) => (
                  <div key={idx} className="text-base-primary leading-6">
                    {line || ' '}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeViewer;
