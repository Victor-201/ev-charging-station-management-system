import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const reservationService = {
  // Get available time slots for a station on a specific date
  getAvailableSlots: async (stationId, date) => {
    const response = await apiClient.get(ENDPOINTS.BOOKING.CHECK, {
      params: {
        station_id: stationId,
        date: date
      }
    });
    return response.data;
  },

  // Create a new reservation
  create: async (data) => {
    const response = await apiClient.post(ENDPOINTS.BOOKING.CREATE, data);
    return response.data;
  },

  // Get all reservations for the current user
  getUserReservations: async (userId) => {
    const url = ENDPOINTS.BOOKING.LIST.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get a specific reservation by its ID
  getById: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.DETAIL.replace(':reservation_id', reservationId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Update a reservation
  update: async (reservationId, data) => {
    const url = ENDPOINTS.BOOKING.UPDATE.replace(':reservation_id', reservationId);
    const response = await apiClient.put(url, data);
    return response.data;
  },

  // Cancel a reservation
  cancel: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.CANCEL.replace(':reservation_id', reservationId);
    const response = await apiClient.delete(url);
    return response.data;
  },

  // Generate QR code for reservation
  generateQR: async (reservationId) => {
    const response = await apiClient.post(ENDPOINTS.BOOKING.QR_GENERATE, {
      reservation_id: reservationId
    });
    return response.data;
  },

  // Validate QR code
  validateQR: async (qrId) => {
    const url = ENDPOINTS.BOOKING.QR_VALIDATE.replace(':qr_id', qrId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Mark QR code as used
  markQRUsed: async (qrId) => {
    const url = ENDPOINTS.BOOKING.QR_MARK_USED.replace(':qr_id', qrId);
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
