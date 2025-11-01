import apiClient from "@/api/apiClient";

export const monitoringService = {
  getLiveStatus: (stationId) => apiClient({ method: "GET", url: `/monitoring-service/live/${stationId}` }),
  getLogs: (params) => apiClient({ method: "GET", url: "/monitoring-service/logs", params }),
};

export default monitoringService;
