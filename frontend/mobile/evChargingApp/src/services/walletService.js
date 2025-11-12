// src/services/walletService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const walletService = {
  getWallet: async (userId) => {
    const url = ENDPOINTS.PAYMENT.GET_WALLET.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  },

  getTransactions: async (userId, params) => {
    const url = ENDPOINTS.WALLET.TRANSACTIONS.replace(':user_id', userId);
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  topup: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENT.TOPUP_WALLET, payload);
    return response.data;
  },

  withdraw: async (payload) => {
    const url = ENDPOINTS.WALLET.WITHDRAW.replace(':user_id', payload.userId);
    const response = await apiClient.post(url, payload);
    return response.data;
  },
};

export default walletService;

