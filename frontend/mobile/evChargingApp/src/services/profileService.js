import mockService from './mockService';

const profileService = {
  getMe: () => mockService.getMe(),

  getProfile: (userId) => mockService.getMe(), // Reuse getMe for simplicity

  updateProfile: (userId, profileData) => {
    // In a real app, you'd update the user and return it.
    // Here, we'll just return the updated data.
    return mockService.mockApi({ user: { ...mockService.getMe().data, ...profileData } });
  },

  changePassword: (userId, passwordData) => {
    return mockService.mockApi({ message: 'Password changed successfully' });
  },

  exportData: (userId) => {
    return mockService.mockApi({ message: 'Data export started' });
  },

  deleteAccount: (userId) => {
    return mockService.mockApi({ message: 'Account deleted successfully' });
  },
};

export default profileService;