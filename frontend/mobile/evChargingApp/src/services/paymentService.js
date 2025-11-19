import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const paymentService = {
  // Wallet Management
  getWallet: async (userId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PAYMENT.GET_WALLET.replace(':user_id', userId));
      return response.data?.data || response.data;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        return { user_id: userId, balance: 0, currency: 'VND', status: 'inactive' };
      }
      throw error;
    }
  },

  getTransactions: async (userId, params) => {
    const response = await apiClient.get(ENDPOINTS.WALLET.TRANSACTIONS.replace(':user_id', userId), { params });
    return response.data?.data || response.data || [];
  },

  topup: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENT.CREATE_TRANSACTION, {
      user_id: payload.user_id,
      type: 'topup',
      amount: payload.amount,
      method: payload.method || 'bank_transfer',
      currency: payload.currency || 'VND',
      description: payload.description || 'Nạp tiền vào ví',
    });
    return response.data?.transaction || response.data;
  },

  withdraw: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.WALLET.WITHDRAW.replace(':user_id', payload.user_id || payload.userId || ''), payload);
    return response.data?.data || response.data;
  },

  // Payment Processing
  createPayment: async (payload) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENT.CREATE_TRANSACTION, payload);
    return response.data?.data || response.data;
  },

  // Invoices
  getInvoice: async (invoiceId) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENT.INVOICE?.replace(':id', invoiceId));
    return response.data?.data || response.data;
  },

  downloadInvoice: async (invoiceId) => {
    const response = await apiClient.get(ENDPOINTS.PAYMENT.DOWNLOAD_INVOICE?.replace(':id', invoiceId));
    return response.data?.data || response.data;
  },
};

export default paymentService;
