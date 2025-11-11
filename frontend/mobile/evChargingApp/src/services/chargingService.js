import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const chargingService = {
  // Initiate a charging session from a booking
  initiate: async (bookingId) => {
    const response = await apiClient.post(ENDPOINTS.CHARGING.INITIATE, {
      reservation_id: bookingId
    });
    return response.data;
  },

  // Start a charging session
  start: async (sessionId) => {
    const response = await apiClient.post(ENDPOINTS.CHARGING.START, {
      session_id: sessionId
    });
    return response.data;
  },

  // Stop a charging session
  stop: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.STOP.replace(':session_id', sessionId);
    const response = await apiClient.post(url);
    return response.data;
  },

  // Pause a charging session
  pause: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.PAUSE.replace(':session_id', sessionId);
    const response = await apiClient.post(url);
    return response.data;
  },

  // Resume a charging session
  resume: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.RESUME.replace(':session_id', sessionId);
    const response = await apiClient.post(url);
    return response.data;
  },

  // Get session details
  getSession: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.DETAIL.replace(':session_id', sessionId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get session events (telemetry)
  getSessionEvents: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.TELEMETRY.replace(':session_id', sessionId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get user's charging history
  getHistory: async (userId, params = {}) => {
    const url = ENDPOINTS.CHARGING.HISTORY.replace(':user_id', userId);
    const response = await apiClient.get(url, { params });
    return response.data;
  },
};

export default chargingService;
