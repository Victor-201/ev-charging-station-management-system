/**
 * Socket Service
 * Centralized WebSocket management for real-time updates
 * Handles: charging telemetry, wallet updates, notifications, station availability
 */

import io from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { logger } from '../utils/logger';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reduxDispatch = null; // Will be set by app initialization
  }

  /**
   * Set Redux dispatch for state updates
   */
  setReduxDispatch(dispatch) {
    this.reduxDispatch = dispatch;
  }

  /**
   * Initialize socket connection
   */
  connect(accessToken) {
    if (this.socket?.connected) {
      logger.debug('Socket already connected');
      return this.socket;
    }

    try {
      this.socket = io(API_BASE_URL, {
        transports: ['websocket'],
        auth: { token: accessToken },
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
      return this.socket;
    } catch (error) {
      logger.error('Failed to initialize socket:', error);
      return null;
    }
  }

  /**
   * Setup core socket event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.debug('Socket connected:', this.socket.id);

      if (this.reduxDispatch) {
        const { setConnected } = require('../store/slices/socketSlice');
        this.reduxDispatch(setConnected({ socketId: this.socket.id }));
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.debug('Socket disconnected:', reason);

      if (this.reduxDispatch) {
        const { setDisconnected } = require('../store/slices/socketSlice');
        this.reduxDispatch(setDisconnected({ reason }));
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error?.message || error);

      if (this.reduxDispatch) {
        const { setError } = require('../store/slices/socketSlice');
        this.reduxDispatch(setError({ message: error?.message }));
      }
    });

    this.socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.socket) {
      logger.warn(`Socket not connected, cannot subscribe to ${event}`);
      return;
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
    this.socket.on(event, callback);
    logger.debug(`Subscribed to event: ${event}`);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
    logger.debug(`Unsubscribed from event: ${event}`);
  }

  /**
   * Emit an event
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      logger.warn(`Socket not connected, cannot emit ${event}`);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.eventListeners.clear();
      this.socket.disconnect();
      this.isConnected = false;
      logger.debug('Socket disconnected');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

export default new SocketService();

