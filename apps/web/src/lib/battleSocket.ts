import { SOCKET_NAMESPACE } from '@shared/constants/socket-event';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function connectBattleSocket(): Socket {
  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(`${SOCKET_SERVER_URL}${SOCKET_NAMESPACE.GAME}`, {
      transports: ['websocket'],
      autoConnect: true,
    });
  } else {
    socket.connect();
  }

  return socket;
}

export function disconnectBattleSocket() {
  socket?.disconnect();
}

export function getBattleSocket() {
  return socket;
}
