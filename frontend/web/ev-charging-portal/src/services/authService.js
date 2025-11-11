// src/services/authService.js
import apiClient from "@/api/apiClient";

export const authService = {
  register: (payload) => apiClient.post("/api/v1/auth/register", payload),
  verify: (payload) => apiClient.post("/api/v1/auth/verify", payload),
  login: (payload) => apiClient.post("/api/v1/auth/login", payload),
  loginWithOAuth: (payload) => apiClient.post("/api/v1/auth/login/oauth", payload),
  refreshToken: (payload) => apiClient.post("/api/v1/auth/refresh-token", payload),
  logout: (payload) => apiClient.post("/api/v1/auth/logout", payload),
  forgotPassword: (payload) => apiClient.post("/api/v1/auth/forgot-password", payload),
  resetPassword: (payload) => apiClient.post("/api/v1/auth/reset-password", payload),
  linkProvider: (payload) => apiClient.post("/api/v1/auth/link-provider", payload),
  unlinkProvider: (payload) => apiClient.post("/api/v1/auth/unlink-provider", payload),
  me: () => apiClient.get("/api/v1/auth/me"),
};

export default authService;
