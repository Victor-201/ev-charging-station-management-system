import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../config/env';

const useSocket = (eventHandlers) => {
  const socket = useRef(null);
  const { accessToken } = useSelector((state) => state.auth);

  const memoizedEventHandlers = useCallback(eventHandlers, Object.values(eventHandlers));

  useEffect(() => {
    if (!accessToken) return;

    socket.current = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
      reconnectionAttempts: 5,
    });

    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
    });

    Object.entries(memoizedEventHandlers).forEach(([event, handler]) => {
      socket.current.on(event, handler);
    });

    socket.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      if (socket.current) {
        console.log('Disconnecting socket...');
        socket.current.disconnect();
      }
    };
  }, [accessToken, memoizedEventHandlers]);

  const emit = useCallback((event, data) => {
    if (socket.current && socket.current.connected) {
      socket.current.emit(event, data);
    }
  }, []);

  return { emit, isConnected: socket.current?.connected };
};

export default useSocket;
