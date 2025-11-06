import apiClient from "@/api/apiClient";

export const analyticsService = {
  // ===== MONITORING =====
  getHealth: () =>
    apiClient({ method: "GET", url: "api/v1/monitoring/health" }),

  getMetrics: () =>
    apiClient({ method: "GET", url: "api/v1/monitoring/metrics" }),

  getLogs: (params) =>
    apiClient({ method: "GET", url: "api/v1/monitoring/logs", params }),

  getAlerts: () =>
    apiClient({ method: "GET", url: "api/v1/monitoring/alerts" }),

  ackAlert: (payload) =>
    apiClient({ method: "POST", url: "api/v1/monitoring/alerts/ack", data: payload }),

  // ===== ANALYTICS =====
  getUserMonthlyReport: (user_id) =>
    apiClient({
      method: "GET",
      url: `api/v1/analytics/reports/user/${user_id}/monthly`,
    }),

  getStationDailyReport: (station_id) =>
    apiClient({
      method: "GET",
      url: `api/v1/analytics/reports/station/${station_id}/daily`,
    }),

  getRevenueReport: (params) =>
    apiClient({
      method: "GET",
      url: "api/v1/analytics/reports/revenue",
      params,
    }),

  trainForecastModel: (payload) =>
    apiClient({
      method: "POST",
      url: "api/v1/analytics/forecast/train",
      data: payload,
    }),

  getForecastByStation: (station_id) =>
    apiClient({
      method: "GET",
      url: `api/v1/analytics/forecast/${station_id}`,
    }),

  // ===== TELEMETRY =====
  getRawTelemetry: (params) =>
    apiClient({ method: "GET", url: "api/v1/telemetry/raw", params }),

  // ===== DASHBOARD =====
  getDashboards: () =>
    apiClient({ method: "GET", url: "api/v1/dashboards" }),

  createDashboard: (payload) =>
    apiClient({ method: "POST", url: "api/v1/dashboards", data: payload }),

  // ===== EXISTING =====
  getOverview: () =>
    apiClient({ method: "GET", url: "api/v1/overview" }),

  getStationStats: (id) =>
    apiClient({ method: "GET", url: `api/v1/stations/${id}` }),

  getRevenue: (params) =>
    apiClient({ method: "GET", url: "api/v1/revenue", params }),
};

export default analyticsService;
