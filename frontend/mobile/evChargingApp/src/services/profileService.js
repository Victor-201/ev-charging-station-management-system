import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const profileService = {
  // Get current user profile
  getMe: async () => {
    const response = await apiClient.get(ENDPOINTS.USER.ME);
    return response.data;
  },

  // Get user profile by ID (admin only)
  getProfile: async (userId) => {
    const url = ENDPOINTS.USER.GET_USER.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Update current user profile
  updateProfile: async (userId, profileData) => {
    const url = ENDPOINTS.USER.UPDATE_USER.replace(':user_id', userId);
    const response = await apiClient.put(url, profileData);
    return response.data;
  },

  // Change password
  changePassword: async (userId, passwordData) => {
    const url = ENDPOINTS.USER.CHANGE_PASSWORD.replace(':user_id', userId);
    const response = await apiClient.put(url, passwordData);
    return response.data;
  },

  // Export user data
  exportData: async (userId) => {
    const url = ENDPOINTS.USER.EXPORT_DATA.replace(':user_id', userId);
    const response = await apiClient.post(url);
    return response.data;
  },

  // Delete/deactivate account
  deleteAccount: async (userId) => {
    const url = ENDPOINTS.USER.DEACTIVATE.replace(':user_id', userId);
    const response = await apiClient.post(url);
    return response.data;
  },

  // Erase user data (GDPR)
  eraseData: async (userId) => {
    const url = ENDPOINTS.USER.ERASE_DATA.replace(':user_id', userId);
    const response = await apiClient.delete(url);
    return response.data;
  },

  // Get linked social accounts
  getSocialAccounts: async (userId) => {
    const url = ENDPOINTS.USER.SOCIAL.LIST.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  },

  // Unlink a social account
  unlinkSocialAccount: async (userId, provider) => {
    const url = ENDPOINTS.USER.SOCIAL.UNLINK.replace(':user_id', userId).replace(':provider', provider);
    const response = await apiClient.delete(url);
    return response.data;
  },

};

export default profileService;