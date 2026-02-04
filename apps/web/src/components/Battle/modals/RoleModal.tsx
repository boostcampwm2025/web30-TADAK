import { AlertCircle } from 'lucide-react';

import Modal from '@/components/Common/Modal';

type RoleModalReason =
  | 'player-to-spectator'
  | 'spectator-to-player'
  | 'not-authorized-player'
  | null;

type RoleModalProps = {
  isOpen: boolean;
  reason: RoleModalReason;
  onConfirm: () => void;
};

const getRoleModalTitle = (reason: RoleModalReason) => {
  if (reason === 'player-to-spectator') {
    return '참가자는 관전자로 전환할 수 없습니다';
  }
  if (reason === 'spectator-to-player') {
    return '관전자는 참가자로 전환할 수 없습니다';
  }
  return '참가자 전용 방입니다';
};

const getRoleModalDescription = (reason: RoleModalReason) => {
  if (reason === 'player-to-spectator') {
    return (
      <>
        참가자 화면으로 이동합니다.
        <br />
        URL을 변경해도 역할은 바뀌지 않습니다.
      </>
    );
  }
  if (reason === 'spectator-to-player') {
    return (
      <>
        관전 화면으로 이동합니다.
        <br />
        참가자 권한이 있어야 입장할 수 있습니다.
      </>
    );
  }
  return (
    <>
      해당 방의 참가자가 아닙니다.
      <br />
      메인 페이지로 이동합니다.
    </>
  );
};

export default function RoleModal({ isOpen, reason, onConfirm }: RoleModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onConfirm}
      icon={AlertCircle}
      iconColor="text-error-01"
      iconBgColor="bg-error-01/20"
      title={getRoleModalTitle(reason)}
      description={getRoleModalDescription(reason)}
      buttons={[
        {
          label: '확인',
          onClick: onConfirm,
          variant: 'black',
        },
      ]}
      closeOnBackdrop={false}
    />
  );
}
