import apiClient from "@/api/apiClient";

export const stationService = {
  getAll: (params) => apiClient({ method: "GET", url: "/station-service/stations", params }),
  getById: (id) => apiClient({ method: "GET", url: `/station-service/stations/${id}` }),
  create: (payload) => apiClient({ method: "POST", url: "/station-service/stations", data: payload }),
  update: (id, payload) => apiClient({ method: "PUT", url: `/station-service/stations/${id}`, data: payload }),
  remove: (id) => apiClient({ method: "DELETE", url: `/station-service/stations/${id}` }),
  getAvailability: (id) => apiClient({ method: "GET", url: `/station-service/stations/${id}/availability` }),
};

export default stationService;
