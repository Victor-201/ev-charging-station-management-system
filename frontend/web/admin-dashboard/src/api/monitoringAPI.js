import axiosClient from "./axiosClient";

const monitoringAPI = {
	getStations: (params) => axiosClient.get("/monitoring/stations", { params }),
	createStation: (data) => axiosClient.post("/monitoring/stations", data),
	updateStation: (id, data) => axiosClient.put(`/monitoring/stations/${id}`, data),
	deleteStation: (id) => axiosClient.delete(`/monitoring/stations/${id}`),
	control: (id, command) => axiosClient.post(`/monitoring/control/${id}`, { command }), // command: start|stop|restart
	alerts: (params) => axiosClient.get("/monitoring/alerts", { params }),
};

export default monitoringAPI;

