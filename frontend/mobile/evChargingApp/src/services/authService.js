// src/services/authService.js
import mockService from './mockService';

const authService = {
  // Authentication
  login: ({ email, password }) => mockService.login(email, password),
  register: (payload) => mockService.register(payload),
  logout: () => mockService.logout(),

  // Email verification - Mocking success
  verifyEmail: (payload) => mockService.mockApi({ message: 'Email verified successfully' }),
  resendVerificationCode: (payload) => mockService.mockApi({ message: 'Verification code sent' }),

  // Password management - Mocking success
  forgotPassword: (email) => mockService.mockApi({ message: 'Password reset link sent' }),
  resetPassword: (payload) => mockService.mockApi({ message: 'Password has been reset' }),

  // Token management
  refreshToken: (refreshToken) => mockService.mockApi({ accessToken: 'new-mock-access-token' }),

  // OAuth - Mocking success
  socialLogin: (payload) => mockService.login('test@example.com', 'password'), // Reuse mock login for simplicity
  linkProvider: (payload) => mockService.mockApi({ message: 'Provider linked' }),
  unlinkProvider: (payload) => mockService.mockApi({ message: 'Provider unlinked' }),
};

export default authService;
