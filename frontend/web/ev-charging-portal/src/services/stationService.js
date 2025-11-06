import apiClient from "@/api/apiClient";

export const stationService = {
  // ===== STATION =====
  getAll: (params) =>
    apiClient({ method: "GET", url: "api/v1/stations", params }),

  create: (payload) =>
    apiClient({ method: "POST", url: "api/v1/stations", data: payload }),

  getById: (station_id) =>
    apiClient({ method: "GET", url: `api/v1/stations/${station_id}` }),

  update: (station_id, payload) =>
    apiClient({ method: "PUT", url: `api/v1/stations/${station_id}`, data: payload }),

  remove: (station_id) =>
    apiClient({ method: "DELETE", url: `api/v1/stations/${station_id}` }),

  getConnectors: (station_id) =>
    apiClient({ method: "GET", url: `api/v1/stations/${station_id}/connectors` }),

  reportIssue: (station_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/stations/${station_id}/report-issue`, data: payload }),

  setMaintenance: (station_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/stations/${station_id}/maintenance`, data: payload }),

  // ===== CHARGER =====
  registerCharger: (payload) =>
    apiClient({ method: "POST", url: `api/v1/chargers`, data: payload }),

  getChargerById: (charger_id) =>
    apiClient({ method: "GET", url: `api/v1/chargers/${charger_id}` }),

  getChargerHealth: (charger_id) =>
    apiClient({ method: "GET", url: `api/v1/chargers/${charger_id}/health` }),

  updateFirmware: (charger_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/chargers/${charger_id}/firmware/update`, data: payload }),

  controlCharger: (charger_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/chargers/${charger_id}/control`, data: payload }),

  // ===== AVAILABILITY =====
  getAvailability: (params) =>
    apiClient({ method: "GET", url: `api/v1/availability`, params }),

  // ===== PRICING =====
  getStationPricing: (station_id) =>
    apiClient({ method: "GET", url: `api/v1/stations/${station_id}/pricing` }),

  getChargerPricing: (charger_id) =>
    apiClient({ method: "GET", url: `api/v1/chargers/${charger_id}/pricing` }),
};

export default stationService;
