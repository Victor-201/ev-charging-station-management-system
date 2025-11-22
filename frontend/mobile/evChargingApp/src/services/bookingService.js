import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Booking Service - Handles reservation and QR APIs
 * Backend: charging-control-service (Port 4002)
 */
const bookingService = {
  // GET /booking/check
  checkAvailability: async (params) => {
    try {
      const response = await apiClient.get(ENDPOINTS.BOOKING.CHECK, { params });
      return response.data;
    } catch (error) {
      console.error('[bookingService] checkAvailability error:', error.response?.data || error.message);
      throw error;
    }
  },

  // POST /booking
  createReservation: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.BOOKING.CREATE, data);
      return response.data;
    } catch (error) {
      console.error('[bookingService] createReservation error:', error.response?.data || error.message);
      throw error;
    }
  },

  // POST /booking/qr/generate (body: { reservation_id, expires_in })
  generateQRCode: async (data) => {
    try {
      const response = await apiClient.post(ENDPOINTS.BOOKING.QR_GENERATE, data);
      return response.data;
    } catch (error) {
      console.error('[bookingService] generateQRCode error:', error.response?.data || error.message);
      throw error;
    }
  },

  // GET /booking/user/:user_id
  getUserBookings: async (userId) => {
    try {
      const url = ENDPOINTS.BOOKING.LIST.replace(':user_id', userId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('[bookingService] getUserBookings error:', error.response?.data || error.message);
      throw error;
    }
  },

  // GET /booking/:reservation_id
  getById: async (reservationId) => {
    try {
      const url = ENDPOINTS.BOOKING.DETAIL.replace(':reservation_id', reservationId);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('[bookingService] getById error:', error.response?.data || error.message);
      throw error;
    }
  },

  // DELETE /booking/:reservation_id
  cancelBooking: async (reservationId) => {
    try {
      const url = ENDPOINTS.BOOKING.CANCEL.replace(':reservation_id', reservationId);
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      console.error('[bookingService] cancelBooking error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default bookingService;

