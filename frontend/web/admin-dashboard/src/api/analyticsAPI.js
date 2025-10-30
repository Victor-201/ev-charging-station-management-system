import axiosClient from "./axiosClient";

const analyticsAPI = {
	overview: () => axiosClient.get("/analytics/overview"),
	metrics: (params) => axiosClient.get("/monitoring/metrics", { params }),
	reports: (params) => axiosClient.get("/analytics/reports", { params }),
	export: (params) => axiosClient.get("/analytics/export", { params, responseType: "blob" }),
};

export default analyticsAPI;

