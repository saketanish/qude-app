import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket = null;

export const socketService = {
  connect() {
    if (socket?.connected) return socket;
    socket = io(SOCKET_URL, { transports: ['websocket'] });
    return socket;
  },
  joinTemple(templeId) { socket?.emit('join:temple', { templeId }); },
  joinQueue(queueId)   { socket?.emit('join:queue', { queueId }); },
  on(event, cb)        { socket?.on(event, cb); return () => socket?.off(event, cb); },
  off(event, cb)       { socket?.off(event, cb); },
  disconnect()         { socket?.disconnect(); socket = null; },
};
