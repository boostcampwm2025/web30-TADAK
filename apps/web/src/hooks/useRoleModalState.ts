import { useMemo } from 'react';

import type { Player } from '@/stores/roomStore';

export type RoleModalReason =
  | 'player-to-spectator'
  | 'spectator-to-player'
  | 'not-authorized-player'
  | null;

type UseRoleModalStateParams = {
  me?: Player;
  roomId: string;
  desiredRole: 'player' | 'spectator';
  roleModalReason: RoleModalReason;
  isRoleModalOpen: boolean;
};

export function useRoleModalState({
  me,
  roomId,
  desiredRole,
  roleModalReason,
  isRoleModalOpen,
}: UseRoleModalStateParams) {
  return useMemo(() => {
    const isRoleMismatch = Boolean(me && me.roomId === roomId && me.role !== desiredRole);
    const mismatchReason = isRoleMismatch
      ? me?.role === 'player'
        ? 'player-to-spectator'
        : 'spectator-to-player'
      : null;
    const modalReason = roleModalReason ?? mismatchReason;
    const shouldShowRoleModal = isRoleModalOpen || isRoleMismatch;

    return {
      isRoleMismatch,
      mismatchReason,
      modalReason,
      shouldShowRoleModal,
    };
  }, [me, roomId, desiredRole, roleModalReason, isRoleModalOpen]);
}
