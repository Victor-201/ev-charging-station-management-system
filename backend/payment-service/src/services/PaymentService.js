import TransactionRepository from '../repositories/TransactionRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import WalletTransactionRepository from '../repositories/WalletTransactionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import localBus from '../core/LocalEventBus.js';
import eventBus from '../core/EventBus.js';
import { randomUUID } from 'crypto';

export default class PaymentService {
  constructor() {
    this.txRepo = new TransactionRepository();
    this.walletRepo = new WalletRepository();
    this.walletTxRepo = new WalletTransactionRepository();
    this.planRepo = new PlanRepository();

    localBus.subscribe('payment.topup.succeeded', async (payload) => {
      try {
        await this._applyTopup(payload);
        console.log(`[PaymentService] Applied top-up for user ${payload.user_id}`);
      } catch (error) {
        console.error(`[PaymentService] Error applying top-up for user ${payload.user_id}:`, error);
      }
    });
  }

  async createTransaction({
    user_id,
    type,
    amount,
    currency = 'VND',
    method,
    related_id = null,
    related_type = null,
    description = '',
  }) {
    amount = Number(amount);
    if (Number.isNaN(amount) || amount <= 0) throw new Error('Invalid amount value');

    if (related_id && !related_type)
      throw new Error('related_type is required when related_id is provided');

    if (related_type === 'subscription' && related_id) {
      const plan = await this.planRepo.findById(related_id);
      if (!plan) throw new Error(`Plan not found: ${related_id}`);
    }

    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    if (method === 'wallet' && !wallet.canSpend(amount))
      throw new Error('Insufficient wallet balance');

    let referenceCode = null;
    if (method === 'bank_transfer') {
      const prefixMap = { topup: 'TOP', subscription: 'SUB', booking: 'BKG', charging: 'CHG' };
      const prefix = prefixMap[related_type] || prefixMap[type] || 'TXN';
      const shortId = randomUUID().replace(/-/g, '').substring(0, 22).toUpperCase();
      referenceCode = `${prefix}${shortId}`;
    }

    const transaction = await this.txRepo.create({
      user_id,
      type,
      amount,
      currency,
      method,
      related_id,
      related_type,
      reference_code: referenceCode,
      meta: { description },
    });

    if (method === 'wallet') {
      await this.walletTxRepo.addTransaction({
        wallet_id: wallet.id,
        transaction_id: transaction.id,
        type: 'payment',
        amount,
        note: description,
      });

      transaction.markSuccess({ paid_at: new Date().toISOString() });
      await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

      if (transaction.related_type === 'subscription') {
        localBus.publish('payment.subscription.succeeded', {
          user_id: transaction.user_id,
          type: 'payment',
          related_id: transaction.related_id,
          related_type: transaction.related_type,
          amount,
          method: transaction.method,
          reference_code: transaction.reference_code,
        });
      }
    }

    return transaction;
  }

  async confirmCashPayment(transaction_id) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    transaction.markSuccess({ confirmed_at: new Date().toISOString() });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    return transaction;
  }

  /**
   * Process webhook payload from bank/gateway
   * payload: object containing reference_code or content and transferAmount and other fields
   */
  async processBankWebhook(payload) {
    console.log('📩 Incoming Webhook Payload:', payload);
    const refCode = payload.code || payload.content?.split(' ')[0];
    if (!refCode) throw Object.assign(new Error('Missing referenceCode in payload'), { status: 400 });

    const prefix = refCode.substring(0, 3).toUpperCase();
    const transaction = await this.txRepo.findByReferenceCode(refCode);
    if (!transaction) return { ok: false, reason: 'transaction not found' };

    const incoming = Number(String(payload.transferAmount).replace(/[,\s]/g, ''));
    if (Number.isNaN(incoming)) return { ok: false, reason: 'invalid amount' };
    if (incoming < Number(transaction.amount)) return { ok: false, reason: 'underpaid' };

    transaction.markSuccess({ webhook: payload, paid_amount: incoming });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    switch (prefix) {
      case 'SUB':
        localBus.publish('payment.subscription.succeeded', {
          user_id: transaction.user_id,
          type: 'payment',
          related_id: transaction.related_id,
          related_type: transaction.related_type || 'subscription',
          amount: incoming,
          method: transaction.method,
          reference_code: refCode,
        });
        break;
      case 'TOP':
        localBus.publish('payment.topup.succeeded', {
          user_id: transaction.user_id,
          amount: incoming,
          reference_code: refCode,
        });
        break;
      case 'BKG': {
        try {
          const eventPayload = {
            user_id: transaction.user_id,
            booking_id: transaction.related_id,
            amount: incoming,
            method: transaction.method,
            reference_code: refCode,
            transaction_id: transaction.id,
          };

          await eventBus.publish('payment.booking.succeeded', eventPayload);

          console.log(
            `[PaymentService] Published booking payment success event for booking_id=${transaction.related_id}`
          );
        } catch (err) {
          console.error(
            `[PaymentService] Failed to publish booking payment event for booking_id=${transaction.related_id}`,
            err.message
          );
          // Optionally: bạn có thể retry hoặc lưu vào DB để gửi lại sau
        }
        break;
      }

      case 'CHG': {
        await eventBus.publish('payment.charging.succeeded', {
          user_id: transaction.user_id,
          session_id: transaction.related_id,
          amount: incoming,
          method: transaction.method,
          reference_code: refCode,
          transaction_id: transaction.id,
        });
        break;
      }

      default: {
        console.warn(`[PaymentService] Unknown payment prefix: ${prefix}`);
        break;
      }
    }

    return {
      ok: true,
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      amount: incoming,
      type: transaction.type,
      reference_code: refCode,
      prefix,
      status: transaction.status,
    };
  }

  async refundPayment(transaction_id, { amount = null, reason }) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    const refundAmount = amount || transaction.amount;

    let wallet = await this.walletRepo.findByUserId(transaction.user_id);
    if (!wallet) wallet = await this.walletRepo.create(transaction.user_id);

    wallet.increase(refundAmount);
    await this.walletRepo.updateBalance(wallet.id, wallet.balance);

    await this.walletTxRepo.addTransaction({
      wallet_id: wallet.id,
      transaction_id: transaction.id,
      type: 'refund',
      amount: refundAmount,
      note: reason,
    });

    transaction.markRefunded({ amount: refundAmount, reason });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    return transaction;
  }

  async getWalletInfo(user_id) {
    const wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) throw Object.assign(new Error('Wallet not found'), { status: 404 });
    return wallet;
  }

  async initiateTopup({ user_id, amount, method = 'bank_transfer' }) {
    const transaction = await this.createTransaction({
      user_id,
      type: 'topup',
      amount,
      method,
      description: `Top-up via ${method}`,
    });
    return transaction;
  }

  async _applyTopup({ user_id, amount, reference_code }) {
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    wallet.increase(amount);
    await this.walletRepo.updateBalance(wallet.id, wallet.balance);

    const walletTx = await this.walletTxRepo.addTransaction({
      wallet_id: wallet.id,
      type: 'topup',
      amount,
      note: `Top-up from transaction: ${reference_code}`,
    });

    return { message: 'Wallet topped up successfully', transaction: walletTx };
  }

  async listUserPayments(user_id) {
    const list = await this.txRepo.listByUser(user_id);
    return list.map((tx) => tx.toJSON());
  }

  async getPaymentById(transaction_id) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    return transaction;
  }
}
