// services/analyticsService.js
import apiClient from "@/api/apiClient";

const analyticsService = {
  /* ======================================================
     MONITORING
  ====================================================== */
  getHealth: () =>
    apiClient({
      method: "GET",
      url: "/api/v1/analytics/monitoring/health",
    }),

  getMetrics: () =>
    apiClient({
      method: "GET",
      url: "/api/v1/analytics/monitoring/metrics",
    }),

  getLogs: (params) =>
    apiClient({
      method: "GET",
      url: "/api/v1/analytics/monitoring/logs",
      params,
    }),

  getAlerts: () =>
    apiClient({
      method: "GET",
      url: "/api/v1/analytics/monitoring/alerts",
    }),

  ackAlert: (payload) =>
    apiClient({
      method: "POST",
      url: "/api/v1/analytics/monitoring/alerts/ack",
      data: payload,
    }),

  /* ======================================================
     ANALYTICS LIST MODE
  ====================================================== */
  getUsersMonthlyList: (monthYYYYMM) =>
    apiClient({
      method: "GET",
      url: "/api/v1/analytics/reports/users/monthly",
      params: { month: monthYYYYMM },
    }),

  getStationsMonthlyList: (monthYYYYMM) =>
    apiClient({
      method: "GET",
      url: "/api/v1/analytics/reports/stations/monthly",
      params: { month: monthYYYYMM },
    }),

  /* ======================================================
     FORECAST (optional - không auto gọi)
  ====================================================== */
  getForecastByStation: (station_id, horizonDays = 7) =>
    apiClient({
      method: "GET",
      url: `/api/v1/analytics/forecast/${station_id}`,
      params: { horizonDays },
    }),
};

export default analyticsService;
export { analyticsService };
