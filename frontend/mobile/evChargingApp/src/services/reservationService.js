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

  // Cancel a reservation
  cancel: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.CANCEL.replace(':reservation_id', reservationId);
    const response = await apiClient.delete(url);
    return response.data;
  },

  // Preview reservation cost
  previewCost: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.PREVIEW_COST.replace(':reservation_id', reservationId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Finalize reservation
  finalize: async (reservationId) => {
    const url = ENDPOINTS.BOOKING.FINALIZE.replace(':reservation_id', reservationId);
    const response = await apiClient.post(url);
    return response.data;
  },
};

export default reservationService;
