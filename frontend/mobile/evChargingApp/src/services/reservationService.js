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
      let serviceUnavailable = false;
      let errorCount = 0;

      console.log(`Fetching available slots for station ${stationId} on ${date}`);

      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`;

        // Check availability for this time slot
        let available = true; // Default to available if service is down
        
        // Skip API calls if service is unavailable to prevent spam
        if (!serviceUnavailable) {
          try {
            const response = await apiClient.get(ENDPOINTS.BOOKING.CHECK, {
              params: {
                station_id: stationId,
                point_id: pointId,
                start_time: startTime,
                end_time: endTime
              },
              timeout: 3000 // 3 second timeout
            });
            available = response.data?.available !== false; // Default true if response unclear
          } catch (error) {
            errorCount++;
            
            // If we get 404 or service unavailable, stop making more requests
            if (error.response?.status === 404 || error.response?.status === 503 || errorCount > 2) {
              serviceUnavailable = true;
              console.warn('Booking service unavailable, showing all slots as available');
            }
            
            // Make slot available by default when service is down
            available = true;
          }
        }

        slots.push({
          id: `${date}-${hour}`, // Add unique ID
          time: `${hour.toString().padStart(2, '0')}:00`,
          startTime: startTime,
          endTime: endTime,
          duration: 60, // minutes
          available: available,
          price: 60000 // Default price, can be updated from station data
        });
      }

      if (serviceUnavailable) {
        console.warn('Note: Booking service is unavailable. All slots shown as available.');
      }

      console.log(`Generated ${slots.length} slots, ${slots.filter(s => s.available).length} available`);
      return { slots };
    } catch (error) {
      console.error('Error generating available slots:', error);
      
      // Return default slots instead of throwing
      const slots = [];
      for (let hour = 8; hour < 20; hour++) {
        slots.push({
          id: `${date}-${hour}`,
          time: `${hour.toString().padStart(2, '0')}:00`,
          startTime: `${date}T${hour.toString().padStart(2, '0')}:00:00`,
          endTime: `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`,
          duration: 60,
          available: true,
          price: 60000
        });
      }
      return { slots };
    }
  },

  // Create a new reservation
  create: async (bookingData) => {
    try {
      console.log('Attempting to create booking with data:', JSON.stringify(bookingData, null, 2));
      const response = await apiClient.post(ENDPOINTS.BOOKING.CREATE, bookingData);
      console.log('Booking creation successful:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        'Error creating booking:',
        JSON.stringify(error.response?.data || error.message, null, 2)
      );

      // Provide a more specific error message
      if (error.response?.data?.message?.includes('no Route matched')) {
        throw new Error('Không thể kết nối đến dịch vụ đặt chỗ. Vui lòng thử lại sau.');
      } else if (error.response?.data) {
        // Re-throw backend error message if available
        throw new Error(error.response.data.message || 'Đã xảy ra lỗi không xác định.');
      } else {
        // Generic network error
        throw new Error('Lỗi mạng hoặc không thể kết nối đến máy chủ.');
      }
    }
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
