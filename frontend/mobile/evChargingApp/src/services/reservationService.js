import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const reservationService = {
  // Get available time slots for a station on a specific date
  // This generates time slots on client-side and checks availability with backend
  getAvailableSlots: async (stationId, date, pointId = '1') => {
    try {
      // Generate time slots (8:00 AM to 8:00 PM, 1-hour intervals)
      const slots = [];
      const startHour = 8;
      const endHour = 20;

      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`;

        // Check availability for this time slot
        let available = false;
        try {
          const response = await apiClient.get(ENDPOINTS.BOOKING.CHECK, {
            params: {
              station_id: stationId,
              point_id: pointId,
              start_time: startTime,
              end_time: endTime
            }
          });
          available = response.data?.available || false;
        } catch (error) {
          console.error(`Error checking slot ${startTime}:`, error);
          available = false;
        }

        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          startTime: startTime,
          endTime: endTime,
          duration: 60, // minutes
          available: available,
          price: 60000 // Default price, can be updated from station data
        });
      }

      return { slots };
    } catch (error) {
      console.error('Error generating available slots:', error);
      throw error;
    }
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
