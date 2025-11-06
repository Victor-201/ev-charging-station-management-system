import apiClient from "@/api/apiClient";

export const chargingControlService = {
  // ===== BOOKING =====
  createBooking: (payload) =>
    apiClient({ method: "POST", url: "api/v1/booking", data: payload }),

  checkAvailability: (params) =>
    apiClient({ method: "GET", url: "api/v1/booking/check", params }),

  getBookingById: (reservation_id) =>
    apiClient({ method: "GET", url: `api/v1/booking/${reservation_id}` }),

  updateBooking: (reservation_id, payload) =>
    apiClient({ method: "PUT", url: `api/v1/booking/${reservation_id}`, data: payload }),

  cancelBooking: (reservation_id) =>
    apiClient({ method: "DELETE", url: `api/v1/booking/${reservation_id}` }),

  joinWaitlist: (payload) =>
    apiClient({ method: "POST", url: "api/v1/booking/waitlist", data: payload }),

  getUserReservations: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/booking/reservations/user/${user_id}` }),

  updateWaitlistStatus: (waitlist_id, payload) =>
    apiClient({ method: "PATCH", url: `api/v1/booking/waitlist/${waitlist_id}/status`, data: payload }),

  getWaitlistByStation: (station_id) =>
    apiClient({ method: "GET", url: `api/v1/booking/waitlist/${station_id}` }),

  deleteWaitlist: (waitlist_id) =>
    apiClient({ method: "DELETE", url: `api/v1/booking/waitlist/${waitlist_id}` }),

  // ===== QR =====
  generateQr: (payload) =>
    apiClient({ method: "POST", url: "api/v1/booking/qr/generate", data: payload }),

  validateQr: (qr_id) =>
    apiClient({ method: "GET", url: `api/v1/booking/qr/${qr_id}/validate` }),

  // ===== SESSION =====
  initiateSession: (payload) =>
    apiClient({ method: "POST", url: "api/v1/charging/initiate", data: payload }),

  startSession: (payload) =>
    apiClient({ method: "POST", url: "api/v1/charging/start", data: payload }),

  pushMeterReading: (session_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/meter`, data: payload }),

  getTelemetry: (session_id, params) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}/telemetry`, params }),

  pauseSession: (session_id) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/pause` }),

  resumeSession: (session_id) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/resume` }),

  stopSession: (payload) =>
    apiClient({ method: "POST", url: "api/v1/charging/stop", data: payload }),

  getSessionById: (session_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}` }),

  getSessionEvents: (session_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}/events` }),

  // ===== NOTIFICATION (gateway) =====
  sendNotification: (payload) =>
    apiClient({ method: "POST", url: "api/v1/notifications/send", data: payload }),
};

export default chargingControlService;
