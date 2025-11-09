import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const paymentService = {
  // Wallet Management
  getWallet: (userId) =>
    apiClient.get(ENDPOINTS.WALLET.BALANCE.replace(':user_id', userId)),

  getTransactions: (userId, params) =>
    apiClient.get(ENDPOINTS.WALLET.TRANSACTIONS.replace(':user_id', userId), { params }),

  topup: (payload) =>
    apiClient.post(ENDPOINTS.WALLET.TOPUP, payload),

  withdraw: (payload) =>
    apiClient.post(ENDPOINTS.WALLET.WITHDRAW.replace(':user_id', payload.user_id || payload.userId || ''), payload),

  // Payment Processing
  createPayment: (payload) =>
    apiClient.post(ENDPOINTS.PAYMENT.CREATE, payload),

  // Invoices
  getInvoice: (invoiceId) =>
    apiClient.get(ENDPOINTS.PAYMENT.INVOICE.replace(':id', invoiceId)),

  downloadInvoice: (invoiceId) =>
    apiClient.get(ENDPOINTS.PAYMENT.DOWNLOAD_INVOICE.replace(':id', invoiceId)),
};

export default paymentService;
