import { useEffect, useRef, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../config/env';
import { logger } from '../utils/logger';

const useSocket = (eventHandlers = {}) => {
  const socket = useRef(null);
  const { accessToken } = useSelector((state) => state.auth);

  // Use useMemo with JSON.stringify to create stable reference without triggering dependency updates
  // This prevents infinite re-renders caused by Object.values() creating new array references
  const memoizedEventHandlers = useMemo(
    () => eventHandlers,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(eventHandlers)]
  );

  useEffect(() => {
    if (!accessToken) return;

    socket.current = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
      reconnectionAttempts: 5,
    });

    socket.current.on('connect', () => {
      logger.debug('Socket connected:', socket.current.id);
    });

    Object.entries(memoizedEventHandlers).forEach(([event, handler]) => {
      if (typeof handler === 'function') {
        socket.current.on(event, handler);
      } else {
        logger.warn(`Invalid handler for event '${event}'`);
      }
    });

    socket.current.on('disconnect', (reason) => {
      logger.debug('Socket disconnected:', reason);
    });

    socket.current.on('connect_error', (err) => {
      logger.error('Socket connection error:', err?.message || err);
    });

    return () => {
      if (socket.current) {
        logger.debug('Disconnecting socket...');
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
