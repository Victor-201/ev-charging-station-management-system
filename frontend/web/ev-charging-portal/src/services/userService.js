import apiClient from "@/api/apiClient";

export const userService = {
  // ===== USER =====
  getProfile: () => apiClient({ method: "GET", url: "api/v1/auth/me" }),
  
};

export default userService;
