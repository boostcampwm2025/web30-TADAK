import { AlertCircle } from 'lucide-react';

import Modal from '@/components/Common/Modal';

type LeaveBattleModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LeaveBattleModal({ isOpen, onCancel, onConfirm }: LeaveBattleModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      icon={AlertCircle}
      iconColor="text-error-01"
      iconBgColor="bg-error-01/20"
      title="배틀을 포기하시겠습니까?"
      description="나가면 기권 패배 처리되며, 레이팅이 하락합니다."
      buttons={[
        {
          label: '취소',
          onClick: onCancel,
          variant: 'muted',
        },
        {
          label: '나가기',
          onClick: onConfirm,
          variant: 'black',
        },
      ]}
      closeOnBackdrop={false}
    />
  );
}
