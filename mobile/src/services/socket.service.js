import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;

export const socketService = {
  connect() {
    if (socket?.connected) return socket;
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    return socket;
  },

  joinQueueRoom(queueId) {
    socket?.emit('join:queue', { queueId });
  },

  joinTokenRoom(tokenId) {
    socket?.emit('join:token', { tokenId });
  },

  onQueueUpdate(cb) {
    socket?.on('queue:update', cb);
    return () => socket?.off('queue:update', cb);
  },

  onTokenCalled(cb) {
    socket?.on('token:called', cb);
    return () => socket?.off('token:called', cb);
  },

  onQueueStatusChange(cb) {
    socket?.on('queue:status_change', cb);
    return () => socket?.off('queue:status_change', cb);
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },
};
