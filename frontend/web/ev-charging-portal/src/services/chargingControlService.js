import apiClient from "@/api/apiClient";

export const chargingControlService = {
  startSession: (payload) => apiClient({ method: "POST", url: "/charging-control-service/start", data: payload }),
  stopSession: (payload) => apiClient({ method: "POST", url: "/charging-control-service/stop", data: payload }),
  getSession: (id) => apiClient({ method: "GET", url: `/charging-control-service/session/${id}` }),
  getSessions: (params) => apiClient({ method: "GET", url: "/charging-control-service/sessions", params }),
};

export default chargingControlService;
