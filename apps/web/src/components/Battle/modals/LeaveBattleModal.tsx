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
      title="대결에서 나가시겠습니까?"
      description="진행 중인 문제 풀이가 모두 사라집니다."
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
