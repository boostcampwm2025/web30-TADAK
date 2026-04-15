import { SOCKET_ERROR } from '@shared/constants/socket-event';
import type { JoinRoomRequest } from '@shared/types/room';
import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

import type { UserProfile } from '@/apis/user';
import type { BattleSocketState } from '@/stores/battleSocketStore';
import { useRoomStore } from '@/stores/roomStore';

type DesiredRole = JoinRoomRequest['requestedRole'];

type UseBattleJoinParams = {
  roomId: string;
  desiredRole: DesiredRole;
  isRoleModalOpen: boolean;
  isRoleMismatch: boolean;
  user: UserProfile | null;
  socket: Socket;
  resumeSession: BattleSocketState['resumeSession'];
  joinRoom: BattleSocketState['joinRoom'];
  onInvalidRole: () => void;
  onRoomNotFound?: () => void;
};

export function useBattleJoin({
  roomId,
  desiredRole,
  isRoleModalOpen,
  isRoleMismatch,
  user,
  socket,
  resumeSession,
  joinRoom,
  onInvalidRole,
  onRoomNotFound,
}: UseBattleJoinParams) {
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (isRoleModalOpen || isRoleMismatch) return;
    if (useRoomStore.getState().me?.roomId === roomId) {
      return;
    }
    const attempt = async () => {
      await resumeSession({ roomId, roleHint: desiredRole }).catch(() => {});
      if (!useRoomStore.getState().me) {
        try {
          const currentUser = userRef.current;
          await joinRoom({
            roomId,
            requestedRole: desiredRole,
            userId: currentUser?.id,
            username: currentUser?.username,
            avatarUrl: currentUser?.avatarUrl,
          });
        } catch (error) {
          const code = (error as Error & { code?: string }).code;
          if (code === SOCKET_ERROR.INVALID_ROLE) {
            onInvalidRole();
          }
        }
      }
    };
    attempt();
  }, [
    isRoleModalOpen,
    isRoleMismatch,
    resumeSession,
    joinRoom,
    roomId,
    desiredRole,
    onInvalidRole,
  ]);

  useEffect(() => {
    const handleReconnect = async () => {
      if (isRoleMismatch) return;
      // 소켓 재연결 시 저장된 세션 기준으로 다시 JOIN_ROOM 시도
      try {
        await resumeSession({ roleHint: desiredRole });
      } catch (error) {
        const code = (error as Error & { code?: string }).code;
        if (code === SOCKET_ERROR.ROOM_NOT_FOUND) {
          onRoomNotFound?.();
          return;
        }
      }
      if (!useRoomStore.getState().me) {
        const currentUser = userRef.current;
        try {
          await joinRoom({
            roomId,
            requestedRole: desiredRole,
            userId: currentUser?.id,
            username: currentUser?.username,
            avatarUrl: currentUser?.avatarUrl,
          });
        } catch (error) {
          const code = (error as Error & { code?: string }).code;
          if (code === SOCKET_ERROR.INVALID_ROLE) {
            onInvalidRole();
          } else if (code === SOCKET_ERROR.ROOM_NOT_FOUND) {
            onRoomNotFound?.();
          }
        }
      }
    };
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [resumeSession, joinRoom, roomId, desiredRole, isRoleMismatch, socket, onInvalidRole]);
}
