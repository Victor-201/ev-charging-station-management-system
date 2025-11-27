/**
 * Socket Events Configuration
 * Centralized definitions for all WebSocket events
 */

// Charging Events
export const CHARGING_EVENTS = {
  UPDATE: 'charging_update',
  TELEMETRY_UPDATE: 'telemetry_update',
  STATUS_CHANGE: 'session_status_change',
  SESSION_STARTED: 'charging_session_started',
  SESSION_COMPLETED: 'charging_session_completed',
  SESSION_PAUSED: 'charging_session_paused',
  SESSION_RESUMED: 'charging_session_resumed',
  ERROR: 'charging_error',
};

// Wallet Events
export const WALLET_EVENTS = {
  BALANCE_UPDATED: 'wallet_balance_updated',
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_COMPLETED: 'transaction_completed',
  TOPUP_CONFIRMED: 'wallet_topup_confirmed',
  WITHDRAWAL_CONFIRMED: 'wallet_withdrawal_confirmed',
};

// Station Events
export const STATION_EVENTS = {
  AVAILABILITY_UPDATED: 'station_availability_updated',
  STATUS_CHANGED: 'station_status_changed',
  MAINTENANCE_STARTED: 'station_maintenance_started',
  MAINTENANCE_ENDED: 'station_maintenance_ended',
};

// Notification Events
export const NOTIFICATION_EVENTS = {
  RECEIVED: 'notification_received',
  UPDATED: 'notification_updated',
  DELETED: 'notification_deleted',
  READ: 'notification_read',
};

// User Events
export const USER_EVENTS = {
  PROFILE_UPDATED: 'user_profile_updated',
  SETTINGS_CHANGED: 'user_settings_changed',
  LOGOUT: 'user_logout',
};

// System Events
export const SYSTEM_EVENTS = {
  CONNECTED: 'connect',
  DISCONNECTED: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',
};

// All events combined
export const ALL_SOCKET_EVENTS = {
  ...CHARGING_EVENTS,
  ...WALLET_EVENTS,
  ...STATION_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...USER_EVENTS,
  ...SYSTEM_EVENTS,
};

/**
 * Event payload types for TypeScript/validation
 */
export const EVENT_PAYLOAD_TYPES = {
  // Charging
  [CHARGING_EVENTS.UPDATE]: {
    sessionId: 'string',
    energyConsumed: 'number',
    targetEnergy: 'number',
    powerKw: 'number',
    soc: 'number',
    estimatedTime: 'number',
    cost: 'number',
    status: 'string',
  },
  [CHARGING_EVENTS.TELEMETRY_UPDATE]: {
    sessionId: 'string',
    voltage: 'number',
    current: 'number',
    temperature: 'number',
    powerKw: 'number',
    energyConsumed: 'number',
  },
  // Wallet
  [WALLET_EVENTS.BALANCE_UPDATED]: {
    userId: 'string',
    balance: 'number',
    previousBalance: 'number',
  },
  [WALLET_EVENTS.TRANSACTION_CREATED]: {
    userId: 'string',
    transactionId: 'string',
    amount: 'number',
    type: 'string',
    timestamp: 'string',
  },
  // Station
  [STATION_EVENTS.AVAILABILITY_UPDATED]: {
    stationId: 'string',
    availablePorts: 'number',
    totalPorts: 'number',
    status: 'string',
  },
  // Notification
  [NOTIFICATION_EVENTS.RECEIVED]: {
    userId: 'string',
    notificationId: 'string',
    title: 'string',
    message: 'string',
    type: 'string',
    timestamp: 'string',
  },
};

export default ALL_SOCKET_EVENTS;

