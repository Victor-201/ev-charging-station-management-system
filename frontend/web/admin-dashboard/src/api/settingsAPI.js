import axiosClient from "./axiosClient";

const settingsAPI = {
	get: () => axiosClient.get("/admin/settings"),
	update: (data) => axiosClient.put("/admin/settings", data),
	backup: () => axiosClient.post("/admin/backup", {}),
};

export default settingsAPI;

