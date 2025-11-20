// services/userService.js
import apiClient from "@/api/apiClient";

const userService = {
  // Lấy profile người dùng hiện tại
  getProfile() {
    return apiClient.get("/api/v1/auth/me").then(res => res.data);
  },

  // Lấy toàn bộ danh sách user (auth)
  getAllUsers() {
    return apiClient.get("/api/v1/auth/users").then(res => res.data);
    // ⬆ res.data = { total, users } → chuẩn API bạn đưa
  },

  // Update user
  updateUser(id) {
    return apiClient.post(`/api/v1/auth/users/${id}/deactivate`).then(res => res.data);
  },

  // Delete user
  deleteUser(id) {
    return apiClient.delete(`/api/v1/auth/users/${id}`).then(res => res.data);
  }
};

export default userService;
