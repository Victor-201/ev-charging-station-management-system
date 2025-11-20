// src/services/walletService.js
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const walletService = {
  getWallet: async (userId) => {
    try {
      // Get transactions and calculate balance from completed topups/payments
      const transactions = await walletService.getTransactions(userId);
      
      // Calculate balance from completed transactions
      let balance = 0;
      transactions.forEach(tx => {
        if (tx.status === 'completed') {
          if (tx.type === 'topup' || tx.type === 'refund') {
            balance += Number(tx.amount);
          } else if (tx.type === 'payment') {
            balance -= Number(tx.amount);
          }
        }
      });
      
      return {
        user_id: userId,
        balance: balance,
        currency: 'VND',
        status: 'active'
      };
    } catch (error) {
      console.error('Error fetching wallet:', error);
      // Return default wallet if error
      return {
        user_id: userId,
        balance: 0,
        currency: 'VND',
        status: 'active'
      };
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

