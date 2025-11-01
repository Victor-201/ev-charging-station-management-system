import apiClient from "@/api/apiClient";

export const userService = {
  getAll: (params) => apiClient({ method: "GET", url: "/user-service/users", params }),
  getById: (id) => apiClient({ method: "GET", url: `/user-service/users/${id}` }),
  create: (payload) => apiClient({ method: "POST", url: "/user-service/users", data: payload }),
  update: (id, payload) => apiClient({ method: "PUT", url: `/user-service/users/${id}`, data: payload }),
  remove: (id) => apiClient({ method: "DELETE", url: `/user-service/users/${id}` }),
  getProfile: () => apiClient({ method: "GET", url: "/user-service/users/me" }),
  updateProfile: (payload) => apiClient({ method: "PUT", url: "/user-service/users/me", data: payload }),
};

export default userService;
