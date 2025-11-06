import apiClient from "@/api/apiClient";

export const userService = {
  // ===== USER =====
  getProfile: () => apiClient({ method: "GET", url: "api/v1/auth/me" }),
  getAll: (params) => apiClient({ method: "GET", url: "api/v1/users", params }),
  getById: (user_id) => apiClient({ method: "GET", url: `api/v1/users/${user_id}` }),
  update: (user_id, payload) =>
    apiClient({ method: "PUT", url: `api/v1/users/${user_id}`, data: payload }),
  changePassword: (user_id, payload) =>
    apiClient({ method: "PUT", url: `api/v1/users/${user_id}/change-password`, data: payload }),
  deactivate: (user_id) =>
    apiClient({ method: "POST", url: `api/v1/users/${user_id}/deactivate` }),
  exportData: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/users/${user_id}/export-data` }),
  erase: (user_id) =>
    apiClient({ method: "DELETE", url: `api/v1/users/${user_id}/erase` }),

  // ===== VEHICLE =====
  addVehicle: (user_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/users/${user_id}/vehicles`, data: payload }),
  getVehicles: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/users/${user_id}/vehicles` }),
  getVehicleById: (vehicle_id) =>
    apiClient({ method: "GET", url: `api/v1/vehicles/${vehicle_id}` }),
  updateVehicle: (vehicle_id, payload) =>
    apiClient({ method: "PUT", url: `api/v1/vehicles/${vehicle_id}`, data: payload }),
  deleteVehicle: (vehicle_id) =>
    apiClient({ method: "DELETE", url: `api/v1/vehicles/${vehicle_id}` }),

  // ===== SUBSCRIPTION =====
  getSubscriptions: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/users/${user_id}/subscriptions` }),
  createSubscription: (user_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/users/${user_id}/subscriptions`, data: payload }),
  cancelSubscription: (user_id, subscription_id) =>
    apiClient({
      method: "POST",
      url: `api/v1/users/${user_id}/subscriptions/${subscription_id}/cancel`,
    }),

  // ===== WALLET =====
  walletTopupCallback: (user_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/wallets/${user_id}/topup/callback`, data: payload }),
  withdraw: (user_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/wallets/${user_id}/withdraw`, data: payload }),
  getTransactions: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/wallets/${user_id}/transactions` }),

  // ===== NOTIFICATIONS =====
  getNotifications: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/notifications/${user_id}` }),
  sendNotification: (payload) =>
    apiClient({ method: "POST", url: `api/v1/notifications/send`, data: payload }),
  scheduleNotification: (payload) =>
    apiClient({ method: "POST", url: `api/v1/notifications/schedule`, data: payload }),
  bookingWebhook: (payload) =>
    apiClient({ method: "POST", url: `api/v1/notifications/webhooks/bookings`, data: payload }),
  registerFCM: (payload) =>
    apiClient({ method: "POST", url: `api/v1/notifications/fcm/register`, data: payload }),
  removeFCM: (payload) =>
    apiClient({ method: "DELETE", url: `api/v1/notifications/fcm/remove`, data: payload }),
  testFCM: (payload) =>
    apiClient({ method: "POST", url: `api/v1/notifications/fcm/test`, data: payload }),
  markAsRead: (notification_id) =>
    apiClient({ method: "PUT", url: `api/v1/notifications/${notification_id}/read` }),
  markAllRead: (user_id) =>
    apiClient({ method: "PUT", url: `api/v1/notifications/${user_id}/read-all` }),

  // ===== STAFF MANAGEMENT =====
  getAllStaff: (params) =>
    apiClient({ method: "GET", url: `api/v1/staff`, params }),
  getStaffStatistics: () =>
    apiClient({ method: "GET", url: `api/v1/staff/statistics` }),
  getStaffByStation: (station_id) =>
    apiClient({ method: "GET", url: `api/v1/staff/station/${station_id}` }),
  getStaffByUser: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/staff/user/${user_id}` }),
  getStaffById: (staff_id) =>
    apiClient({ method: "GET", url: `api/v1/staff/${staff_id}` }),
  getStaffAttendance: (staff_id) =>
    apiClient({ method: "GET", url: `api/v1/staff/${staff_id}/attendance` }),
  getStaffAttendanceSummary: (staff_id) =>
    apiClient({ method: "GET", url: `api/v1/staff/${staff_id}/attendance/summary` }),
};

export default userService;
