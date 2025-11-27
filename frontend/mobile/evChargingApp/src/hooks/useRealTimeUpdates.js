/**
 * useRealTimeUpdates Hook
 * Manages real-time socket subscriptions with automatic cleanup
 * Prevents memory leaks by unsubscribing on unmount
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { logger } from '../utils/logger';

/**
 * Hook for subscribing to real-time updates via WebSocket
 * @param {Object} events - Object with event names as keys and callbacks as values
 * @param {boolean} enabled - Whether to enable subscriptions (default: true)
 * @returns {Object} Socket status and methods
 */
export const useRealTimeUpdates = (events = {}, enabled = true) => {
  const { accessToken } = useSelector((state) => state.auth);
  const subscriptionsRef = useRef([]);

  // Initialize socket connection on mount
  useEffect(() => {
    if (!enabled || !accessToken) return;

    try {
      socketService.connect(accessToken);
    } catch (error) {
      logger.error('Failed to connect socket:', error);
    }

    return () => {
      // Cleanup subscriptions on unmount
      subscriptionsRef.current.forEach(({ event, callback }) => {
        socketService.off(event, callback);
      });
      subscriptionsRef.current = [];
    };
  }, [accessToken, enabled]);

  // Subscribe to events
  useEffect(() => {
    if (!enabled || !socketService.isConnected) return;

    Object.entries(events).forEach(([event, callback]) => {
      if (typeof callback === 'function') {
        socketService.on(event, callback);
        subscriptionsRef.current.push({ event, callback });
        logger.debug(`Subscribed to ${event}`);
      }
    });

    return () => {
      // Cleanup on event changes
      subscriptionsRef.current.forEach(({ event, callback }) => {
        socketService.off(event, callback);
      });
      subscriptionsRef.current = [];
    };
  }, [events, enabled]);

  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);

  return {
    isConnected: socketService.isConnected,
    emit,
    socketStatus: socketService.getStatus(),
  };
};

export default useRealTimeUpdates;

