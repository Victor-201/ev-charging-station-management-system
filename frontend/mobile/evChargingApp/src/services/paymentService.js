import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const paymentService = {
  // Wallet Management
  getWallet: async (userId) => {
    try {
      // Get transactions and calculate balance
      const transactions = await apiClient.get(ENDPOINTS.WALLET.TRANSACTIONS.replace(':user_id', userId));
      const txList = transactions.data?.data || transactions.data || [];
      
      let balance = 0;
      txList.forEach(tx => {
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
      console.error('Error getting wallet:', error);
      return { user_id: userId, balance: 0, currency: 'VND', status: 'active' };
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
    // Backend returns { transaction, invoice }
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

  // ===== Charging Cost Analytics =====

  /**
   * Lấy chi phí sạc hàng tháng của người dùng (payment - refund)
   * @param {string} userId - ID của người dùng
   * @param {number} months - Số tháng cần lấy (mặc định 12)
   * @returns {Promise<Object>} Object với key là tháng (YYYY-MM) và value là chi phí
   */
  getMonthlyChargingCost: async (userId, months = 12) => {
    try {
      const endpoint = ENDPOINTS.PAYMENT.REVENUE.MONTHLY_CHARGING_COST.replace(':user_id', userId);
      const response = await apiClient.get(endpoint, {
        params: { months }
      });
      return response.data?.data || {};
    } catch (error) {
      console.error('Error getting monthly charging cost:', error);
      throw error;
    }
  },

  /**
   * Lấy tổng chi phí sạc của người dùng (payment - refund)
   * @param {string} userId - ID của người dùng
   * @returns {Promise<number>} Tổng chi phí sạc
   */
  getChargingTotal: async (userId) => {
    try {
      const endpoint = ENDPOINTS.PAYMENT.REVENUE.TOTAL_CHARGING_COST.replace(':user_id', userId);
      const response = await apiClient.get(endpoint);
      return response.data?.total || 0;
    } catch (error) {
      console.error('Error getting charging total:', error);
      throw error;
    }
  },

  /**
   * Lấy chi phí sạc hàng tháng của người dùng hiện tại
   * @param {number} months - Số tháng cần lấy (mặc định 12)
   * @returns {Promise<Object>} Object với key là tháng (YYYY-MM) và value là chi phí
   */
  getMyMonthlyChargingCost: async (months = 12) => {
    try {
      const endpoint = ENDPOINTS.PAYMENT.REVENUE.MONTHLY_CHARGING_COST_CURRENT;
      const response = await apiClient.get(endpoint, {
        params: { months }
      });
      return response.data?.data || {};
    } catch (error) {
      console.error('Error getting my monthly charging cost:', error);
      throw error;
    }
  },

  /**
   * Lấy tổng chi phí sạc của người dùng hiện tại
   * @returns {Promise<number>} Tổng chi phí sạc
   */
  getMyChargingTotal: async () => {
    try {
      const endpoint = ENDPOINTS.PAYMENT.REVENUE.TOTAL_CHARGING_COST_CURRENT;
      const response = await apiClient.get(endpoint);
      return response.data?.total || 0;
    } catch (error) {
      console.error('Error getting my charging total:', error);
      throw error;
    }
  },
};

export default paymentService;
