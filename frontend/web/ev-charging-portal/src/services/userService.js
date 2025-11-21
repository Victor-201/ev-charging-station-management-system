// services/userService.js
import apiClient from "@/api/apiClient";

const userService = {
  // Lấy profile người dùng hiện tại
  getProfile() {
    return apiClient.get("/api/v1/auth/me").then(res => res.data);
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
    // Nếu API chỉ có deactivate, patch có thể bỏ
    return apiClient.post(`/api/v1/auth/users/${id}/deactivate`).then(res => res.data);
  },

  // Delete user
  deleteUser(id) {
    return apiClient.delete(`/api/v1/auth/users/${id}`).then(res => res.data);
  }
};

export default userService;
