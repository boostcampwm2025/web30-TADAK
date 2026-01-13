import type { ElementType, ReactNode } from 'react';

import Button from '@/components/ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  icon?: ElementType;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  description: string | ReactNode;
  buttons?: {
    label: string;
    onClick: () => void;
    variant?: 'green' | 'black' | 'muted';
  }[];
  closeOnBackdrop?: boolean;
}

export default function Modal({
  isOpen,
  icon: Icon,
  iconColor = 'text-green-05',
  iconBgColor = 'bg-green-05/20',
  title,
  description,
  buttons,
  closeOnBackdrop = true,
  onClose,
}: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="mx-4 w-full max-w-md rounded-3xl bg-base-faint p-8 shadow-2xl text-base-primary select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {Icon && (
          <div className="mb-4 flex justify-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBgColor}`}
            >
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
          </div>
        )}

        <h3 className="mb-2 text-center text-xl font-bold">{title}</h3>

        <div className="mb-8 text-center text-base leading-relaxed">{description}</div>

        {buttons && buttons.length > 0 && (
          <div className="flex gap-4">
            {buttons.map((btn, idx) => (
              <Button
                key={idx}
                variant={btn.variant || 'green'}
                onClick={btn.onClick}
                className="flex-1 px-6 py-3"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
