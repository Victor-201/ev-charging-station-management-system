import pool from '../config/database';
import { WalletTransaction, PaginationParams } from '../types';
import logger from '../utils/logger';
import axios from 'axios';

export class WalletService {
  // Get wallet transactions
  async getTransactions(userId: string, params: PaginationParams & { from?: string; to?: string }): Promise<{ transactions: WalletTransaction[] }> {
    try {
      const { page = 1, size = 20, from, to } = params;
      const offset = (page - 1) * size;

      let whereConditions = ['user_id = $1'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      if (from) {
        whereConditions.push(`created_at >= $${paramIndex}`);
        queryParams.push(from);
        paramIndex++;
      }

      if (to) {
        whereConditions.push(`created_at <= $${paramIndex}`);
        queryParams.push(to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await pool.query(
        `SELECT id AS transaction_id, transaction_id AS external_id, amount, type, status, provider, provider_ref, description, created_at
         FROM wallet_transactions
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, size, offset]
      );

      return { transactions: result.rows };
    } catch (error) {
      logger.error('Error getting wallet transactions:', error);
      throw error;
    }
  }

  // Handle topup callback from payment gateway
  async handleTopupCallback(data: {
    user_id: string;
    transaction_id: string;
    provider_status: string;
    provider_ref: string;
    amount: number;
  }): Promise<{ transaction_id: string; status: string; balance_after: number }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update transaction status
      const status = data.provider_status === 'success' ? 'SUCCEEDED' : 'FAILED';

      await client.query(
        `INSERT INTO wallet_transactions (user_id, transaction_id, amount, type, status, provider_ref, description)
         VALUES ($1, $2, $3, 'TOPUP', $4, $5, 'Top-up from payment gateway')
         ON CONFLICT (transaction_id) 
         DO UPDATE SET status = $4, provider_ref = $5, updated_at = CURRENT_TIMESTAMP`,
        [data.user_id, data.transaction_id, data.amount, status, data.provider_ref]
      );

      // If successful, notify payment service to update wallet balance
      let balance_after = 0;
      if (status === 'SUCCEEDED') {
        try {
          const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
          const response = await axios.post(`${paymentServiceUrl}/api/v1/internal/wallets/${data.user_id}/credit`, {
            amount: data.amount,
            transaction_id: data.transaction_id,
            description: 'Top-up completed',
          });
          balance_after = response.data.balance;
        } catch (error) {
          logger.error('Error updating wallet balance:', error);
          // Don't throw error here, transaction is still recorded
        }
      }

      await client.query('COMMIT');

      return {
        transaction_id: data.transaction_id,
        status,
        balance_after,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error handling topup callback:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Request withdrawal
  async requestWithdrawal(userId: string, data: {
    amount: number;
    bank_account: string;
    bank_code: string;
  }): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate withdrawal ID
      const withdrawId = `WD${Date.now()}`;

      // Create withdrawal transaction
      await client.query(
        `INSERT INTO wallet_transactions (user_id, transaction_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'WITHDRAW', 'PROCESSING', $4)`,
        [userId, withdrawId, data.amount, `Withdraw to ${data.bank_code} ${data.bank_account}`]
      );

      // TODO: Call payment service to process withdrawal
      try {
        const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
        await axios.post(`${paymentServiceUrl}/api/v1/internal/wallets/${userId}/debit`, {
          amount: data.amount,
          transaction_id: withdrawId,
          description: 'Withdrawal request',
        });
      } catch (error) {
        logger.error('Error processing withdrawal:', error);
        throw new Error('Unable to process withdrawal at this time');
      }

      await client.query('COMMIT');
      return withdrawId;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error requesting withdrawal:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new WalletService();
