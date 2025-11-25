import apiClient from "@/api/apiClient";

export const chargingControlService = {
  // ===== BOOKING =====
  // Tạo phiên sạc (khi user cắm xe và hệ thống khởi tạo session)
  initiateSession: (payload) =>
    apiClient({ method: "POST", url: "api/v1/charging/initiate", data: payload }),

  // Bắt đầu sạc sau khi xác nhận
  startSession: (payload) =>
    apiClient({ method: "POST", url: "api/v1/charging/start", data: payload }),

  // Xem điểm sạc nào đang hoạt động tại một trạm
  getActivePointsByStation: (station_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${station_id}/active-points` }),

  // Xem danh sách session của user (nếu nhân viên cần check khách)
  getUserSessions: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${user_id}/sessions` }),

  // Lấy thông tin chi tiết 1 session (rất quan trọng)
  getSessionById: (session_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}` }),

  // Lấy telemetry để hiển thị thông số theo thời gian thực
  getTelemetry: (session_id, params) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}/telemetry`, params }),

  // Lấy log event (để nhân viên biết session có pause/resume/error)
  getSessionEvents: (session_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}/events` }),

  // ==== QUYỀN CAN THIỆP CỦA NHÂN VIÊN ====

  // Tạm dừng phiên sạc
  pauseSession: (session_id) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/pause` }),

  // Tiếp tục sạc
  resumeSession: (session_id) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/resume` }),

  // Dừng sạc
  stopSession: (payload) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/stop`, data: payload }),

  // Sau khi kết thúc sạc thì lấy hóa đơn
  getInvoiceBySession: (session_id) =>
    apiClient({ method: "GET", url: `api/v1/charging/${session_id}/invoice` }),

  // Nếu hóa đơn sai hoặc đầy lỗi thì nhân viên reconcile (điều chỉnh)
  reconcileSession: (session_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/charging/${session_id}/reconcile`, data: payload }),
  // ===== RESERVATION =====
getReservationById: (reservation_id) =>
  apiClient({ method: "GET", url: `api/v1/booking/${reservation_id}` }),

    // ===== QR CODE =====
  validateQr: (qr_id) =>
    apiClient({ method: "GET", url: `api/v1/booking/qr/${qr_id}/validate` }),

   getReservationById: (reservation_id) =>
    apiClient({ method: "GET", url: `api/v1/booking/${reservation_id}` }),

};


export default chargingControlService;
