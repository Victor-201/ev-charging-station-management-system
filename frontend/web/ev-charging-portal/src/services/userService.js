// services/userService.js
import apiClient from "@/api/apiClient";

const userService = {
  // Lấy profile người dùng hiện tại
  getProfile() {
    return apiClient.get("/api/v1/users/profile").then(res => res.data);
  },

  // Lấy toàn bộ danh sách user (Admin) có pagination + filter
  getAllUsers(params = {}) {
    const query = new URLSearchParams({
      page: params.page ?? 1,
      size: params.size ?? 20,
      q: params.q ?? "",
      role: params.role ?? "",
      status: params.status ?? ""
    }).toString();
    
    return apiClient.get(`/api/v1/auth/users?${query}`).then(res => res.data);
    // res.data = { total, users }
  },

  // Update user (ở đây đang deactivate)
  updateUser(id, patch) {
    if (!id) throw new Error("userId is required");

    // Trạng thái được map sang activate/deactivate do API tách riêng 2 endpoint
    if (patch?.status === "inactive") {
      return apiClient.post(`/api/v1/auth/users/${id}/deactivate`).then(res => res.data);
    }
    if (patch?.status === "active") {
      return apiClient.post(`/api/v1/auth/users/${id}/activate`).then(res => res.data);
    }

    // Các trường khác (nếu có) fallback qua user-service
    return apiClient.put(`/api/v1/users/${id}`, patch).then(res => res.data);
  },

  getUserById(userId) {
    if (!userId) throw new Error("userId is required");
    return apiClient.get(`/api/v1/users/${userId}`).then(res => res.data);
  },

  // Delete user
  deleteUser(id) {
    if (!id) throw new Error("userId is required");
    // Hiện API chỉ hỗ trợ deactivate, dùng như "soft delete"
    return apiClient.post(`/api/v1/auth/users/${id}/deactivate`).then(res => res.data);
  }
};

export default userService;
