// src/services/authService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const authService = {
  login: (payload) => apiClient.post(ENDPOINTS.AUTH.LOGIN, payload),
  register: (payload) => apiClient.post(ENDPOINTS.AUTH.REGISTER, payload),
  forgotPassword: (email) => apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (token, password) => apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, password }),
  refreshToken: (refreshToken) => apiClient.post(ENDPOINTS.AUTH.REFRESH, { refreshToken }),
  socialLogin: (provider, token) => apiClient.post(ENDPOINTS.AUTH.SOCIAL, { provider, token }),
};

export default authService;
