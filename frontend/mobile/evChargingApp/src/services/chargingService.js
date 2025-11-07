import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const chargingService = {
  // Initiate a charging session from a booking
  initiate: (bookingId) =>
    apiClient.post(ENDPOINTS.CHARGING.INITIATE, { booking_id: bookingId }),

  // Start a charging session
  start: (sessionId) =>
    apiClient.post(ENDPOINTS.CHARGING.START.replace(':session_id', sessionId)),

  // Stop a charging session
  stop: (sessionId) =>
    apiClient.post(ENDPOINTS.CHARGING.STOP.replace(':session_id', sessionId)),

  // Pause a charging session
  pause: (sessionId) =>
    apiClient.post(ENDPOINTS.CHARGING.PAUSE.replace(':session_id', sessionId)),

  // Resume a charging session
  resume: (sessionId) =>
    apiClient.post(ENDPOINTS.CHARGING.RESUME.replace(':session_id', sessionId)),

  // Get session details
  getSession: (sessionId) =>
    apiClient.get(ENDPOINTS.CHARGING.SESSION.replace(':session_id', sessionId)),

  // Get session events
  getSessionEvents: (sessionId) =>
    apiClient.get(ENDPOINTS.CHARGING.EVENTS.replace(':session_id', sessionId)),

  // Get user's charging history
  getHistory: (userId) =>
    apiClient.get(ENDPOINTS.CHARGING.HISTORY.replace(':user_id', userId)),
};

export default chargingService;
