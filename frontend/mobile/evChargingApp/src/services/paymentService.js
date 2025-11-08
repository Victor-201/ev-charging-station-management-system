import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const paymentService = {
  // Wallet Management
  getWallet: (userId) =>
    apiClient.get(ENDPOINTS.PAYMENT.WALLET.replace(':user_id', userId)),

  getTransactions: (userId, params) =>
    apiClient.get(ENDPOINTS.PAYMENT.TRANSACTIONS.replace(':user_id', userId), { params }),

  topup: (payload) =>
    apiClient.post(ENDPOINTS.PAYMENT.TOPUP, payload),

  withdraw: (payload) =>
    apiClient.post(ENDPOINTS.PAYMENT.WITHDRAW, payload),

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
