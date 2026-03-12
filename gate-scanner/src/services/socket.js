import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;

export const socketService = {
  connect() {
    if (socket?.connected) return;
    socket = io(SOCKET_URL, { transports: ['websocket'] });
  },
  joinTemple(templeId) { socket?.emit('join:temple', { templeId }); },
  disconnect()         { socket?.disconnect(); socket = null; },
};
