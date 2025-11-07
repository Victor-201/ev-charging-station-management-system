import apiClient from '../api/apiClient';

const reservationService = {
  // Get available time slots for a station on a specific date
  getAvailableSlots: (stationId, date) =>
    apiClient.get(`/stations/${stationId}/slots`, { params: { date } }),

  // Create a new reservation
  create: (data) => apiClient.post('/reservations', data),

  // Get all reservations for the current user
  getUserReservations: () => apiClient.get('/reservations/me'),

  // Get a specific reservation by its ID
  getById: (reservationId) => apiClient.get(`/reservations/${reservationId}`),

  // Cancel a reservation
  cancel: (reservationId) => apiClient.post(`/reservations/${reservationId}/cancel`),
};

export default reservationService;
