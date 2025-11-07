// src/services/authService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const authService = {
  // Authentication
  login: (payload) => apiClient.post(ENDPOINTS.AUTH.LOGIN, payload),
  register: (payload) => apiClient.post(ENDPOINTS.AUTH.REGISTER, payload),
  logout: (refreshToken) => apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken }),

  // Email verification
  verifyEmail: (payload) => apiClient.post(ENDPOINTS.AUTH.VERIFY, payload),
  resendVerificationCode: (payload) => apiClient.post(ENDPOINTS.AUTH.RESEND_CODE, payload),

  // Password management
  forgotPassword: (email) => apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (payload) => apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload),

  // Token management
  refreshToken: (refreshToken) => apiClient.post(ENDPOINTS.AUTH.REFRESH, { refreshToken }),

  // OAuth
  socialLogin: (payload) => apiClient.post(ENDPOINTS.AUTH.SOCIAL, payload),
  linkProvider: (payload) => apiClient.post(ENDPOINTS.AUTH.LINK_PROVIDER, payload),
  unlinkProvider: (payload) => apiClient.post(ENDPOINTS.AUTH.UNLINK_PROVIDER, payload),
};

export default authService;
