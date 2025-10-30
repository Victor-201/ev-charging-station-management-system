import axiosClient from "./axiosClient";

const pricingAPI = {
	plans: (params) => axiosClient.get("/pricing/plans", { params }),
	createPlan: (data) => axiosClient.post("/pricing/plans", data),
	updatePlan: (id, data) => axiosClient.put(`/pricing/plans/${id}`, data),
	deletePlan: (id) => axiosClient.delete(`/pricing/plans/${id}`),
};

export default pricingAPI;

