import TransactionRepository from '../repositories/TransactionRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import WalletTransactionRepository from '../repositories/WalletTransactionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import EventOutboxRepository from '../repositories/EventOutboxRepository.js';
import localBus from '../core/LocalEventBus.js';
import eventBus from '../core/EventBus.js';
import config from '../config/env.js';
import { randomUUID } from 'crypto';

/**
 * PaymentService (sửa lỗi & robust)
 */
export default class PaymentService {
  constructor() {
    this.txRepo = new TransactionRepository();
    this.walletRepo = new WalletRepository();
    this.walletTxRepo = new WalletTransactionRepository();
    this.planRepo = new PlanRepository();
    this.outboxRepo = new EventOutboxRepository();

    localBus.subscribe('payment.topup.succeeded', p => this._applyWalletTopup(p));
    localBus.subscribe('payment.refund', p => this._applyWalletRefund(p));

    setInterval(() => {
      this.processOutboxEvents().catch(err => {
        // TODO: replace console.error bằng logger
        console.error('processOutboxEvents failed', err);
      });
    }, 5 * 60 * 1000);

    setInterval(() => {
      this.retryFailedRefunds().catch(err => {
        console.error('retryFailedRefunds failed', err);
      });
    }, 60 * 1000); 
  }

  /** === Helper: ghi event vào Outbox === */
  async _createOutbox(type, aggregate_id, payload, status = 'pending') {
    await this.outboxRepo.create({
      aggregate_type: 'transaction',
      aggregate_id,
      type,
      payload: JSON.stringify(payload),
      status
    });
  }

  /** === Helper xử lý Wallet nội bộ === */
  async _handleWalletInternal(user_id, amount, action, transaction_id = null) {
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    if (action === 'payment') {
      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }
      wallet.decrease(amount);
      await this.walletRepo.updateBalance(wallet.id, wallet.balance);

    } else if (['topup', 'refund'].includes(action)) {
      wallet.increase(amount);
      await this.walletRepo.updateBalance(wallet.id, wallet.balance);

    } else {
      throw new Error('Invalid wallet action');
    }
  }

  /** === Tạo giao dịch === */
  async createTransaction({ user_id, type, amount, currency = 'VND', method,
    related_id = null, related_type = null, description = '' }) {

    amount = Number(amount);
    if (Number.isNaN(amount) || amount <= 0) throw new Error('Invalid amount value');
    if (related_id && !related_type) throw new Error('related_type is required when related_id is provided');

    const prefixMap = { topup: 'TOP', subscription: 'SUB', booking: 'BKG', charging_session: 'CHG', guest_charging: 'CHG' };
    const referenceCode = method === 'bank_transfer'
      ? `${prefixMap[related_type] || prefixMap[type] || 'TXN'}${randomUUID().replace(/-/g, '').substring(0, 22).toUpperCase()}`
      : null;

    let qrLink = null;
    if (method === 'bank_transfer') {
      const { QR_ACCOUNT: acc, QR_BANK: bank } = config;
      if (!acc || !bank) throw new Error('QR_ACCOUNT and QR_BANK must be defined');
      qrLink = `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${referenceCode}`;
    }

    const transaction = await this.txRepo.create({
      user_id, type, amount, currency, method,
      related_id, related_type, reference_code: referenceCode,
      meta: { description, qrLink }
    });

    // Thanh toán bằng Wallet
    if (method === 'wallet') {
      try {
        // lấy lại wallet mới nhất trước khi ghi walletTx
        let wallet = await this.walletRepo.findByUserId(user_id);
        if (!wallet) wallet = await this.walletRepo.create(user_id);

        await this._handleWalletInternal(user_id, amount, type, transaction.id);
        await this.walletTxRepo.addTransaction({
          wallet_id: wallet.id,
          transaction_id: transaction.id,
          type,
          amount,
          note: description
        });

        transaction.markSuccess({ paid_at: new Date().toISOString() });
        await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

        // Domain event cross-service -> ghi outbox (pending)
        await this._createOutbox(`payment.${type}.succeeded`, transaction.id, {
          user_id,
          transaction_id: transaction.id,
          amount,
          method,
          reference_code: referenceCode
        }, 'pending');

      } catch (err) {
        transaction.markFailed({ reason: err.message });
        await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

        await this._createOutbox(`payment.${type}.failed`, transaction.id, {
          user_id,
          transaction_id: transaction.id,
          amount,
          reason: err.message
        }, 'pending');
      }
    }

    return transaction;
  }

  /** === Áp dụng Wallet Topup (LocalBus) === */
  async _applyWalletTopup({ user_id, amount, transaction_id = null }) {
    await this._handleWalletInternal(user_id, amount, 'topup');
  }

  /** === Áp dụng Wallet Refund (LocalBus) === */
  async _applyWalletRefund({ user_id, amount, transaction_id }) {
    if (!transaction_id) throw new Error('transaction_id is required for refund');

    const tx = await this.txRepo.findById(transaction_id);
    if (!tx) return;
    if (tx.refunded) return; 

    try {
      await this._handleWalletInternal(user_id, amount, 'refund', transaction_id);
      tx.markRefunded({ refunded_at: new Date().toISOString() });
      await this.txRepo.updateStatus(tx.id, tx.status, tx.meta);

      localBus.publish('payment.refund.success', { user_id, amount, transaction_id });

    } catch (err) {
      await this._createOutbox('payment.refund.retry', transaction_id, { user_id, amount }, 'failed');
    }
  }

  /** === Xử lý Outbox retry === */
  async processOutboxEvents(limit = 50) {
    const events = await this.outboxRepo.findPending(limit);
    if (!events || events.length === 0) return;

    try {
      await eventBus.connect();
    } catch (err) {
      console.error('eventBus connect failed', err);
    }

    for (const evt of events) {
      let payload;
      try {
        payload = JSON.parse(evt.payload);
      } catch (err) {
        await this.outboxRepo.markAsFailed(evt.id);
        continue;
      }

      const tx = await this.txRepo.findById(evt.aggregate_id);

      const finalizedStates = ['completed', 'succeeded', 'failed', 'refunded'];
      if (!tx || finalizedStates.includes(tx.status)) {
        await this.outboxRepo.markAsProcessed(evt.id);
        continue;
      }

      try {
        if (eventBus.channel && evt.type) {
          try {
            eventBus.channel.publish(eventBus.exchange, evt.type, Buffer.from(evt.payload));
          } catch (pubErr) {
            throw pubErr;
          }
        }

        if (evt.type === 'payment.refund.retry') {
          await this._applyWalletRefund({ user_id: payload.user_id, amount: payload.amount, transaction_id: evt.aggregate_id });
        }

        await this.outboxRepo.markAsProcessed(evt.id);
      } catch (err) {
        console.error('processOutboxEvents item failed', evt.id, err);
        await this.outboxRepo.markAsFailed(evt.id);
      }
    }
  }

  /** Retry liên tục các refund thất bại */
  async retryFailedRefunds(limit = 50) {
    const events = await this.outboxRepo.findFailed('payment.refund.retry', limit);
    if (!events || events.length === 0) return;

    for (const evt of events) {
      let payload;
      try {
        payload = JSON.parse(evt.payload);
      } catch {
        continue;
      }
      try {
        await this._applyWalletRefund({ user_id: payload.user_id, amount: payload.amount, transaction_id: evt.aggregate_id });
        await this.outboxRepo.markAsProcessed(evt.id);
      } catch (err) {
        console.error('retryFailedRefunds item failed', evt.id, err);
      }
    }
  }

  /** === Confirm Cash Payment === */
  async confirmCashPayment(transaction_id) {
    const tx = await this.txRepo.findById(transaction_id);
    if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    if (tx.type !== 'charging') throw Object.assign(new Error('Only charging transactions supported'), { status: 400 });

    tx.markSuccess({ confirmed_at: new Date().toISOString() });
    await this.txRepo.updateStatus(tx.id, tx.status, tx.meta);

    await this._createOutbox('payment.charging.succeeded', tx.id, {
      user_id: tx.user_id,
      transaction_id: tx.id,
      related_id: tx.related_id,
      related_type: 'charging',
      amount: tx.amount,
      method: tx.method,
      reference_code: tx.reference_code
    }, 'pending');

    return tx;
  }

  /** === Webhook ngân hàng === */
  async processBankWebhook(payload) {
    const maybeCodeCandidates = [];
    if (payload.code) maybeCodeCandidates.push(String(payload.code));
    if (payload.content) maybeCodeCandidates.push(String(payload.content));
    let refCode = null;
    const regex = /(TOP|SUB|BKG|CHG)[A-F0-9]{22}/i;
    for (const text of maybeCodeCandidates) {
      const m = text.match(regex);
      if (m) { refCode = m[0].toUpperCase(); break; }
    }
    if (!refCode) throw Object.assign(new Error('Missing referenceCode'), { status: 400 });

    const transaction = await this.txRepo.findByReferenceCode(refCode);
    if (!transaction) return { ok: false, reason: 'transaction not found' };

    const incoming = Number(String(payload.transferAmount ?? payload.amount ?? 0).replace(/[,\s]/g, ''));
    if (Number.isNaN(incoming)) return { ok: false, reason: 'invalid amount' };
    if (incoming < Number(transaction.amount)) return { ok: false, reason: 'underpaid' };

    try {
      transaction.markSuccess({ webhook: payload, paid_amount: incoming });
      await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);
    } catch (e) {
      console.error('Failed to update transaction:', e);
      throw e;
    }

    const category = {
      SUB: 'subscription',
      TOP: 'topup',
      BKG: 'booking',
      CHG: 'charging'
    }[refCode.substring(0, 3).toUpperCase()];

    if (category) {
      const eventType = `payment.${category}.succeeded`;
      await this._createOutbox(eventType, transaction.id, {
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        related_id: transaction.related_id,
        related_type: category,
        amount: incoming,
        method: transaction.method,
        reference_code: refCode
      }, 'processed');

      if (['topup', 'subscription'].includes(category)) {
        localBus.publish(eventType, { subscription_id: transaction.related_id });
      }
    }

    return {
      ok: true,
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      amount: incoming,
      type: transaction.type,
      reference_code: refCode,
      status: transaction.status
    };
  }

  /** === API tiện ích / thống kê === */
  async listUserPayments(user_id) {
    const list = await this.txRepo.listByUser(user_id);
    return list.map(tx => (typeof tx.toJSON === 'function' ? tx.toJSON() : tx));
  }

  async getPaymentById(transaction_id) {
    const tx = await this.txRepo.findById(transaction_id);
    if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    return tx;
  }

  async revenueSummary() { return this.txRepo.getRevenueSummary(); }
  async todayRevenue() { return this.txRepo.getTodayRevenue(); }
  async dailyRevenue(days = 30) { return this.txRepo.getDailyRevenue(days); }
  async monthlyRevenue(months = 12) { return this.txRepo.getMonthlyRevenue(months); }
  async revenueByType() { return this.txRepo.getRevenueByType(); }
  async getTotalTransactions() { return this.txRepo.count({ status: 'completed' }); }
}