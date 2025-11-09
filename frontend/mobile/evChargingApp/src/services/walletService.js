// src/services/walletService.js
import paymentService from './paymentService';

const walletService = {
  // Call real backend via paymentService which uses apiClient and API_BASE_URL
  getWallet: async (userId) => {
    const response = await paymentService.getWallet(userId);
    // paymentService returns axios response; return response.data for callers
    return response.data;
  },

  getTransactions: async (userId, params) => {
    const response = await paymentService.getTransactions(userId, params);
    return response.data;
  },

  topup: async (payload) => {
    const response = await paymentService.topup(payload);
    return response.data;
  },

  withdraw: async (payload) => {
    const response = await paymentService.withdraw(payload);
    return response.data;
  },
};

export default walletService;

