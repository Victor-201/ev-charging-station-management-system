// src/services/walletService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const walletService = {
  getWallet: async (userId) => {
    try {
      const url = ENDPOINTS.PAYMENT.GET_WALLET.replace(':user_id', userId);
      const response = await apiClient.get(url);
      // Backend returns { success: true, data: {...} }
      return response.data?.data || response.data;
    } catch (error) {
      // If wallet doesn't exist (404), return a default wallet object
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('Wallet not found for user, returning default wallet');
        return {
          user_id: userId,
          balance: 0,
          currency: 'VND',
          status: 'inactive'
        };
      }
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
    // Use createTransaction endpoint since TOPUP_WALLET endpoint may not exist
    const response = await apiClient.post(ENDPOINTS.PAYMENT.CREATE_TRANSACTION, {
      user_id: payload.user_id,
      type: 'topup',
      amount: payload.amount,
      method: payload.method || 'bank_transfer',
      currency: payload.currency || 'VND',
      description: payload.description || 'Nạp tiền vào ví',
    });
    // Backend returns { transaction: {...}, invoice: {...} }
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

