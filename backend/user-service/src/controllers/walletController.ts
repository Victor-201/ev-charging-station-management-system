import { Request, Response } from 'express';
import walletService from '../services/walletService';
import logger from '../utils/logger';

export class WalletController {
  // POST /api/v1/wallets/:user_id/topup/callback - Handle topup callback
  async handleTopupCallback(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { transaction_id, provider_status, provider_ref, amount } = req.body;

      const result = await walletService.handleTopupCallback({
        user_id,
        transaction_id,
        provider_status,
        provider_ref,
        amount: parseFloat(amount),
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in handleTopupCallback:', error);
      res.status(500).json({ error: 'Failed to process callback' });
    }
  }

  // POST /api/v1/wallets/:user_id/withdraw - Request withdrawal
  async requestWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { amount, bank_account, bank_code } = req.body;

      const withdrawId = await walletService.requestWithdrawal(user_id, {
        amount: parseFloat(amount),
        bank_account,
        bank_code,
      });

      res.status(201).json({
        withdraw_id: withdrawId,
        status: 'processing',
      });
    } catch (error: any) {
      logger.error('Error in requestWithdrawal:', error);
      if (error.message.includes('Unable to process')) {
        res.status(503).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to request withdrawal' });
      }
    }
  }

  // GET /api/v1/wallets/:user_id/transactions - Get transaction history
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { from, to, page = '1', size = '20' } = req.query;

      const result = await walletService.getTransactions(user_id, {
        page: parseInt(page as string),
        size: parseInt(size as string),
        from: from as string,
        to: to as string,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in getTransactions:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }
}

export default new WalletController();
