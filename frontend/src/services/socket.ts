import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';

let socket: Socket | null = null;

export const initSocketClient = () => {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(ENV.SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[SOCKET CLIENT CONNECTED] ID:', socket?.id);
    const user = useAuthStore.getState().user;
    if (user) {
      if (user.role === 'FARMER') {
        socket?.emit('join:farmer', user._id);
      }
      if (user.centreId) {
        socket?.emit('join:centre', user.centreId);
      }
      if (user.districtId) {
        socket?.emit('join:district', user.districtId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET CLIENT DISCONNECTED]');
  });

  return socket;
};

export const getSocketClient = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
