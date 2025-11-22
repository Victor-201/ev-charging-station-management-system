import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const reservationService = {
  /**
   * Check availability for a specific time slot.
   * @param {{ station_id: string, point_id: string, start_time: string, end_time: string }} params
   * @returns {Promise<{available: boolean}>}
   */
  checkAvailability: async (params) => {
    try {
      const response = await apiClient.get(ENDPOINTS.BOOKING.CHECK, { params });
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error.response?.data || error.message);
      // Default to not available on error to be safe
      return { available: false };
    }
  },

  /**
   * Create a new reservation.
   * @param {object} bookingData - The data for the new reservation.
   * @returns {Promise<object>}
   */
  createReservation: async (bookingData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.BOOKING.CREATE, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create reservation.');
    }
  },

  /**
   * Get all reservations for a specific user.
   * @param {string} userId
   * @returns {Promise<Array<object>>}
   */
  getUserReservations: async (userId) => {
    const url = ENDPOINTS.BOOKING.LIST.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get a specific reservation by its ID.
   * @param {string} reservationId
   * @returns {Promise<object>}
   */
  getById: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.DETAIL.replace(':reservation_id', reservationId);
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Cancel a reservation.
   * @param {string} reservationId
   * @returns {Promise<object>}
   */
  cancel: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.CANCEL.replace(':reservation_id', reservationId);
    // The controller uses POST for cancellation
    const response = await apiClient.post(url);
    return response.data;
  },

  /**
   * Generate a QR code for a reservation.
   * @param {string} reservationId
   * @returns {Promise<object>}
   */
  createQrCode: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.QR_GENERATE.replace(':reservation_id', reservationId);
    const response = await apiClient.post(url);
    return response.data;
  },

  // Waitlist operations
  addToWaitlist: async (data) => {
    const response = await apiClient.post(ENDPOINTS.BOOKING.WAITLIST_ADD, data);
    return response.data;
  },

  getWaitlist: async (stationId) => {
    const url = ENDPOINTS.BOOKING.WAITLIST_GET.replace(':station_id', stationId);
    const response = await apiClient.get(url);
    return response.data;
  },

  updateWaitlistStatus: async (waitlistId, status) => {
    const url = ENDPOINTS.BOOKING.WAITLIST_UPDATE.replace(':waitlist_id', waitlistId);
    const response = await apiClient.patch(url, { status });
    return response.data;
  },

  removeFromWaitlist: async (waitlistId) => {
    const url = ENDPOINTS.BOOKING.WAITLIST_REMOVE.replace(':waitlist_id', waitlistId);
    const response = await apiClient.delete(url);
    return response.data;
  },
};

export default reservationService;
