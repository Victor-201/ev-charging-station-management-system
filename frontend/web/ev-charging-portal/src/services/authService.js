import apiClient from "@/api/apiClient";

export const authService = {
  login: (payload) => apiClient({ method: "POST", url: "/auth-service/auth/login", data: payload }),
  register: (payload) => apiClient({ method: "POST", url: "/auth-service/auth/register", data: payload }),
  refresh: (payload) => apiClient({ method: "POST", url: "/auth-service/auth/refresh", data: payload }),
  logout: () => apiClient({ method: "POST", url: "/auth-service/auth/logout" }),
  me: () => apiClient({ method: "GET", url: "/auth-service/auth/me" }),
};

export default authService;
