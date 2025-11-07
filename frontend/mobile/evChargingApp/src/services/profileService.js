import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const profileService = {
  getMe: () => apiClient.get(ENDPOINTS.USER.ME),

  getProfile: (userId) => {
    const url = ENDPOINTS.USER.PROFILE.replace(':user_id', userId);
    return apiClient.get(url);
  },

  updateProfile: (userId, profileData) => {
    const url = ENDPOINTS.USER.UPDATE_PROFILE.replace(':user_id', userId);
    return apiClient.put(url, profileData);
  },

  changePassword: (userId, passwordData) => {
    const url = ENDPOINTS.USER.CHANGE_PASSWORD.replace(':user_id', userId);
    return apiClient.put(url, passwordData);
  },
};

export default profileService;