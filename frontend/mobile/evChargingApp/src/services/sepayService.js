/**
 * Sepay Payment Service
 * Handles wallet top-up via bank transfer using Sepay gateway
 */

import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { logger } from '../utils/logger';

/**
 * Sepay Service for handling payment operations
 */
export const sepayService = {
  /**
   * Create a top-up request
   * @param {number} amount - Amount to top up (VND)
   * @returns {Promise<Object>} Payment data including QR code info
   */
  async createTopUpRequest(amount) {
    try {
      logger.info('Creating Sepay top-up request', { amount });

      const response = await apiClient.post(ENDPOINTS.PAYMENT.TOPUP_WALLET, {
        amount,
        payment_method: 'bank_transfer',
        provider: 'sepay'
      });

      logger.info('Sepay top-up request created', { 
        transaction_id: response.data.transaction_id 
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create Sepay top-up request', error);
      throw error;
    }
  },

  /**
   * Check payment status
   * @param {string} transactionId - Transaction ID to check
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(transactionId) {
    try {
      logger.debug('Checking payment status', { transactionId });

      const response = await apiClient.get(
        ENDPOINTS.PAYMENT.GET_TRANSACTION.replace(':id', transactionId)
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to check payment status', error);
      throw error;
    }
  },

  /**
   * Generate QR code URL for bank transfer
   * @param {Object} paymentData - Payment information
   * @returns {string} QR code image URL
   */
  generateQRCodeUrl(paymentData) {
    const { account_number, bank_code, amount, transfer_content } = paymentData;

    // VietQR standard format
    // Format: https://img.vietqr.io/image/{bank_code}-{account_number}-{template}.jpg?amount={amount}&addInfo={content}
    const baseUrl = 'https://img.vietqr.io/image';
    const template = 'compact2'; // or 'compact', 'print', 'qr_only'
    
    const qrUrl = `${baseUrl}/${bank_code}-${account_number}-${template}.jpg?amount=${amount}&addInfo=${encodeURIComponent(transfer_content)}`;

    logger.debug('Generated QR code URL', { qrUrl });
    return qrUrl;
  },

  /**
   * Format amount to Vietnamese currency
   * @param {number} amount - Amount in VND
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  /**
   * Validate top-up amount
   * @param {number} amount - Amount to validate
   * @returns {Object} Validation result
   */
  validateAmount(amount) {
    const MIN_AMOUNT = 10000; // 10,000 VND
    const MAX_AMOUNT = 50000000; // 50,000,000 VND

    if (!amount || isNaN(amount)) {
      return {
        valid: false,
        error: 'Vui lòng nhập số tiền hợp lệ'
      };
    }

    if (amount < MIN_AMOUNT) {
      return {
        valid: false,
        error: `Số tiền tối thiểu là ${this.formatAmount(MIN_AMOUNT)}`
      };
    }

    if (amount > MAX_AMOUNT) {
      return {
        valid: false,
        error: `Số tiền tối đa là ${this.formatAmount(MAX_AMOUNT)}`
      };
    }

    return { valid: true };
  },

  /**
   * Get predefined top-up amounts
   * @returns {Array<number>} Array of predefined amounts
   */
  getPredefinedAmounts() {
    return [
      50000,    // 50k
      100000,   // 100k
      200000,   // 200k
      500000,   // 500k
      1000000,  // 1M
      2000000   // 2M
    ];
  },

  /**
   * Calculate transaction fee
   * @param {number} amount - Transaction amount
   * @returns {number} Fee amount
   */
  calculateFee(amount) {
    // Sepay typically has no fee for bank transfer
    // But you can implement fee logic here if needed
    return 0;
  },

  /**
   * Get bank information
   * @returns {Object} Bank details for transfer
   */
  getBankInfo() {
    return {
      bank_name: 'Ngân hàng TMCP Á Châu (ACB)',
      bank_code: 'ACB',
      account_number: '123456789',
      account_name: 'CONG TY EV CHARGING',
      branch: 'Chi nhánh TP.HCM'
    };
  }
};

export default sepayService;

