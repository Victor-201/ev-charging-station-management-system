// src/services/walletService.js
import mockService from './mockService';

const walletService = {
  getWallet: (userId) => mockService.getWallet(userId),
  getTransactions: (params) => mockService.getWalletTransactions(params.userId, { limit: params.limit }),
  topup: (payload) => mockService.topupWallet(payload),
  withdraw: (payload) => mockService.withdrawFromWallet(payload),
};

export default walletService;

