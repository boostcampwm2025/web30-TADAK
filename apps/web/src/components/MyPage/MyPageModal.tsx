import { X } from 'lucide-react';
import { useEffect } from 'react';

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MyPageModal({ isOpen, onClose, title, children }: MyPageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-container bg-bg-layer-2 w-full max-w-[1000px] h-full max-h-[85vh] rounded-[32px] flex flex-col overflow-hidden shadow-2xl animate-fade-slide-in">
        <div className="modal-header p-6 px-8 border-b border-border-soft flex justify-between items-center shrink-0">
          <h3 className="text-xl font-extrabold">{title}</h3>
          <button
            className="modal-close bg-base-muted w-8 h-8 rounded-xl cursor-pointer flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-content flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden min-h-0">
          {children}
        </div>
        <div className="modal-footer p-6 px-8 border-t border-border-soft flex justify-end shrink-0">
          <button
            className="cursor-pointer btn-close bg-ink text-white px-8 py-3 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

interface MyPageModalPaneProps {
  header: string;
  children: React.ReactNode;
  isWhite?: boolean;
}

export function MyPageModalPane({ header, children, isWhite }: MyPageModalPaneProps) {
  return (
    <div
      className={`pane flex flex-col border-r border-border-soft last:border-r-0 min-h-0 ${isWhite ? 'bg-white' : ''}`}
    >
      <div className="pane-header p-3 px-6 bg-bg-layer-1 text-[11px] font-extrabold text-base-tertiary uppercase shrink-0">
        {header}
      </div>
      <div className="pane-body flex-1 p-6 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-ink chat-scroll">
        {children}
      </div>
    </div>
  );
}
