import mockService from './mockService';

const reservationService = {
  // Get available time slots for a station on a specific date
  getAvailableSlots: (stationId, date) =>
    mockService.getAvailableSlots(stationId, date),

  // Create a new reservation
  create: (data) => mockService.createReservation(data),

  // Get all reservations for the current user
  getUserReservations: (userId) => mockService.getUserReservations(userId),

  // Get a specific reservation by its ID
  getById: (reservationId) => mockService.getReservationById(reservationId),

  // Cancel a reservation
  cancel: (reservationId) => mockService.cancelReservation(reservationId),
};

export default reservationService;
