/**
 * Socket Status Slice
 * Manages WebSocket connection status and diagnostics
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  socketId: null,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  reconnectAttempts: 0,
  error: null,
  activeSubscriptions: [], // Track active event subscriptions
  metrics: {
    eventsReceived: 0,
    eventsSent: 0,
    averageLatency: 0,
    lastEventTime: null,
  },
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    // Connection status
    setConnected: (state, action) => {
      state.isConnected = true;
      state.socketId = action.payload?.socketId;
      state.lastConnectedAt = new Date().toISOString();
      state.reconnectAttempts = 0;
      state.error = null;
    },

    setDisconnected: (state, action) => {
      state.isConnected = false;
      state.lastDisconnectedAt = new Date().toISOString();
      state.error = action.payload?.reason || null;
    },

    setReconnecting: (state, action) => {
      state.reconnectAttempts = action.payload?.attempts || 0;
    },

    setError: (state, action) => {
      state.error = action.payload?.message || 'Unknown error';
    },

    // Subscriptions tracking
    addSubscription: (state, action) => {
      const event = action.payload?.event;
      if (event && !state.activeSubscriptions.includes(event)) {
        state.activeSubscriptions.push(event);
      }
    },

    removeSubscription: (state, action) => {
      const event = action.payload?.event;
      state.activeSubscriptions = state.activeSubscriptions.filter(e => e !== event);
    },

    // Metrics
    recordEventReceived: (state) => {
      state.metrics.eventsReceived += 1;
      state.metrics.lastEventTime = new Date().toISOString();
    },

    recordEventSent: (state) => {
      state.metrics.eventsSent += 1;
    },

    updateLatency: (state, action) => {
      const latency = action.payload?.latency || 0;
      const current = state.metrics.averageLatency || 0;
      const count = state.metrics.eventsReceived || 1;
      state.metrics.averageLatency = (current * (count - 1) + latency) / count;
    },

    // Reset
    resetMetrics: (state) => {
      state.metrics = initialState.metrics;
    },

    resetSocket: (state) => {
      return initialState;
    },
  },
});

export const {
  setConnected,
  setDisconnected,
  setReconnecting,
  setError,
  addSubscription,
  removeSubscription,
  recordEventReceived,
  recordEventSent,
  updateLatency,
  resetMetrics,
  resetSocket,
} = socketSlice.actions;

export default socketSlice.reducer;

