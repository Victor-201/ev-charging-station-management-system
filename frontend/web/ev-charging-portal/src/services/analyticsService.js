import apiClient from "@/api/apiClient";

export const analyticsService = {
  getOverview: () => apiClient({ method: "GET", url: "/analytics-service/overview" }),
  getStationStats: (id) => apiClient({ method: "GET", url: `/analytics-service/stations/${id}` }),
  getRevenue: (params) => apiClient({ method: "GET", url: "/analytics-service/revenue", params }),
};

export default analyticsService;
