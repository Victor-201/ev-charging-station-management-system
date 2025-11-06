import apiClient from "@/api/apiClient";

export const authService = {
  // Đăng ký tài khoản (email/phone + vehicle)
  register: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/register", data: payload }),

  // Xác thực OTP (email/phone)
  verify: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/verify", data: payload }),

  // Đăng nhập (email/phone + password)
  login: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/login", data: payload }),
  
  // Đăng nhập qua OAuth (Google/Facebook)
  loginWithOAuth: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/login/oauth", data: payload }),

  // Làm mới access token bằng refresh token
  refreshToken: (payload) =>
apiClient({ method: "POST", url: "api/v1/auth/refresh-token", data: payload }),

  // Đăng xuất (revoke refresh token)
  logout: (payload) =>
    // payload tuỳ chọn (ví dụ: { refresh_token: "..." }) — nếu backend không cần thì gọi không truyền payload
apiClient({ method: "POST", url: "api/v1/auth/logout", data: payload }),

  // Yêu cầu đặt lại mật khẩu (gửi email OTP)
  forgotPassword: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/forgot-password", data: payload }),

  // Đặt lại mật khẩu sử dụng token
  resetPassword: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/reset-password", data: payload }),

  // Link tài khoản OAuth vào user hiện tại
  linkProvider: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/link-provider", data: payload }),

  // Bỏ link OAuth khỏi tài khoản
  unlinkProvider: (payload) =>
    apiClient({ method: "POST", url: "api/v1/auth/unlink-provider", data: payload }),

  // Thông tin user hiện tại (giữ lại theo mẫu cũ nếu backend có)
  me: () =>
apiClient({ method: "GET", url: "api/v1/auth/me" }),
};

export default authService;
