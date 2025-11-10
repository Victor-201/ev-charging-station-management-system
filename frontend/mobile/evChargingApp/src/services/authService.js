// src/services/authService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const authService = {
  // Authentication
  login: async ({ email, password }) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    return response.data;
  },

  register: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
    return response.data;
  },

  logout: async () => {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      return response.data;
    } catch (error) {
      // Even if API call fails, we still want to logout locally
      return { message: 'Logged out locally' };
    }
  },

  // Email verification
  verifyEmail: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.VERIFY, payload);
    return response.data;
  },

  resendVerificationCode: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.RESEND_CODE, payload);
    return response.data;
  },

  // Password management
  forgotPassword: async (email) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  },

  resetPassword: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return response.data;
  },

  // Token management
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });
    return response.data;
  },

  // OAuth
  socialLogin: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.SOCIAL, payload);
    return response.data;
  },

  linkProvider: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LINK_PROVIDER, payload);
    return response.data;
  },

  unlinkProvider: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.UNLINK_PROVIDER, payload);
    return response.data;
  },
};

export default authService;
