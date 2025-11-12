import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const chargingService = {
  // Initiate a charging session from a booking
  initiate: async (reservationId) => {
    const response = await apiClient.post(ENDPOINTS.CHARGING.INITIATE, {
      reservation_id: reservationId
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

  // Get session telemetry (real-time data)
  getTelemetry: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.TELEMETRY.replace(':session_id', sessionId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get session events
  getEvents: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.GET_EVENTS.replace(':session_id', sessionId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Push meter reading
  pushMeterReading: async (sessionId, meterData) => {
    const url = ENDPOINTS.CHARGING.PUSH_METER.replace(':session_id', sessionId);
    const response = await apiClient.post(url, meterData);
    return response.data;
  },

  // Confirm payment for session
  confirmPayment: async (sessionId, paymentData) => {
    const url = ENDPOINTS.CHARGING.CONFIRM_PAYMENT.replace(':session_id', sessionId);
    const response = await apiClient.post(url, paymentData);
    return response.data;
  },

  // Get invoice for session
  getInvoice: async (sessionId) => {
    const url = ENDPOINTS.CHARGING.GET_INVOICE.replace(':session_id', sessionId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Reconcile session (for payment discrepancies)
  reconcileSession: async (sessionId, reconcileData) => {
    const url = ENDPOINTS.CHARGING.RECONCILE.replace(':session_id', sessionId);
    const response = await apiClient.post(url, reconcileData);
    return response.data;
  },

  // Get user's charging history
  getHistory: async (userId, params = {}) => {
    const url = ENDPOINTS.CHARGING.USER_SESSIONS.replace(':user_id', userId);
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  // Get active charging points at a station
  getActivePoints: async (stationId) => {
    const url = ENDPOINTS.CHARGING.ACTIVE_POINTS.replace(':station_id', stationId);
    const response = await apiClient.get(url);
    return response.data;
  },
};

export default chargingService;
