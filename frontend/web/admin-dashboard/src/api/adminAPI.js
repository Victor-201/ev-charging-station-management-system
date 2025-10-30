import axiosClient from "./axiosClient";

const adminAPI = {
	users: (params) => axiosClient.get("/admin/users", { params }),
	createUser: (data) => axiosClient.post("/admin/users", data),
	updateUser: (id, data) => axiosClient.put(`/admin/users/${id}`, data),
	deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`),
	roles: () => axiosClient.get("/admin/roles"),
	assignRole: (id, role) => axiosClient.post(`/admin/users/${id}/roles`, { role }),
};

export default adminAPI;

