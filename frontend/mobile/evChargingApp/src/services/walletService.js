// src/services/walletService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const walletService = {
  getWallet: async (userId) => {
    try {
      // Fetch REAL wallet balance from payment-service
      const url = ENDPOINTS.PAYMENT.GET_WALLET.replace(':user_id', userId);
      const response = await apiClient.get(url);
      // Backend returns { success: true, data: { user_id, balance, currency, status } }
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  },

  getTransactions: async (userId, params) => {
    const url = ENDPOINTS.WALLET.TRANSACTIONS.replace(':user_id', userId);
    const response = await apiClient.get(url, { params });
    // Backend returns { success: true, data: [...] }
    return response.data?.data || response.data || [];
  },

  topup: async (payload) => {
    // Use createTransaction endpoint directly
    const response = await apiClient.post(ENDPOINTS.PAYMENT.CREATE_TRANSACTION, {
      user_id: payload.user_id,
      type: 'topup',
      amount: payload.amount,
      method: payload.method || 'bank_transfer',
      currency: payload.currency || 'VND',
      description: payload.description || 'Nạp tiền vào ví',
    });
    // Backend returns { transaction, invoice }
    return response.data?.transaction || response.data;
  },

  withdraw: async (payload) => {
    const url = ENDPOINTS.WALLET.WITHDRAW.replace(':user_id', payload.userId);
    const response = await apiClient.post(url, payload);
    // Backend returns { success: true, data: {...} }
    return response.data?.data || response.data;
  },
};

export default walletService;

