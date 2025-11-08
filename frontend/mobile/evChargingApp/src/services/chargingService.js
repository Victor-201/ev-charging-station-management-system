import mockService from './mockService';

const chargingService = {
  // Initiate a charging session from a booking
  initiate: (bookingId) =>
    mockService.mockApi({ sessionId: `session-${Date.now()}`, status: 'initiated' }),

  // Start a charging session
  start: (sessionId) =>
    mockService.mockApi({ status: 'charging' }),

  // Stop a charging session
  stop: (sessionId) =>
    mockService.mockApi({ status: 'completed' }),

  // Pause a charging session
  pause: (sessionId) =>
    mockService.mockApi({ status: 'paused' }),

  // Resume a charging session
  resume: (sessionId) =>
    mockService.mockApi({ status: 'charging' }),

  // Get session details
  getSession: (sessionId) =>
    mockService.getSession(sessionId),

  // Get session events
  getSessionEvents: (sessionId) =>
    mockService.getSessionEvents(sessionId),

  // Get user's charging history
  getHistory: (userId) =>
    mockService.getChargingHistory(userId),
};

export default chargingService;
