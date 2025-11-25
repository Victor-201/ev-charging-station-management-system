import TransactionRepository from '../repositories/TransactionRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import WalletTransactionRepository from '../repositories/WalletTransactionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import EventOutboxRepository from '../repositories/EventOutboxRepository.js';
import localBus from '../core/LocalEventBus.js';
import { publishEvent } from "../core/rabbit/publisher.js";
import { initRabbitConnection } from '../core/rabbit/connection.js';
import config from '../config/env.js';
import { randomUUID } from 'crypto';

export default class PaymentService {
  constructor() {
    this.transactionRepo = new TransactionRepository();
    this.walletRepo = new WalletRepository();
    this.walletTxRepo = new WalletTransactionRepository();
    this.planRepo = new PlanRepository();
    this.outboxRepo = new EventOutboxRepository();

    localBus.subscribe('payment.topup.succeeded', (p) => this._applyWalletTopup(p));
    localBus.subscribe('payment.refund', (p) => this._applyWalletRefund(p));

    setInterval(() => this.processOutboxEvents().catch((e) => console.error(e)), 3 * 60 * 1000);
    setInterval(() => this.retryFailedRefunds().catch((e) => console.error(e)), 60 * 1000);
  }

  async _createOutbox(type, aggregate_id, payload, status = 'pending') {
    await this.outboxRepo.create({
      id: randomUUID(),
      aggregate_type: 'transaction',
      aggregate_id,
      type,
      payload: JSON.stringify(payload),
      status,
      created_at: new Date().toISOString(),
    });
  }

  async _handleWalletInternal(user_id, amount, action, transaction_id = null) {
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) throw new Error('Amount must be positive');

    if (action === 'topup') {
      if (wallet.balance < amount) throw new Error('Insufficient wallet balance');
      wallet.decrease(amount);
      await this.walletRepo.updateBalance(wallet.id, wallet.balance);
    } else if (action === 'refund') {
      wallet.increase(amount);
      await this.walletRepo.updateBalance(wallet.id, wallet.balance);
    } else throw new Error('Invalid wallet action');
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
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');
    if (related_id && !related_type) throw new Error('related_type required');

    const prefixMap = {
      topup: 'TOP',
      subscription: 'SUB',
      booking: 'BKG',
      charging_session: 'CHG',
      guest_charging: 'CHG',
    };
    const referenceCode =
      method === 'bank_transfer'
        ? `${prefixMap[related_type] || prefixMap[type] || 'TXN'}${randomUUID()
          .replace(/-/g, '')
          .substring(0, 22)
          .toUpperCase()}`
        : null;

    let qrLink = null;
    if (method === 'bank_transfer') {
      const { QR_ACCOUNT: acc, QR_BANK: bank } = config;
      if (!acc || !bank) throw new Error('QR_ACCOUNT/QR_BANK required');
      qrLink = `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${referenceCode}`;
    }

    const transaction = await this.transactionRepo.create({
      user_id,
      type,
      amount,
      currency,
      method,
      related_id,
      related_type,
      reference_code: referenceCode,
      meta: { description, qrLink },
    });

    if (method === 'wallet') {
      try {
        let wallet = await this.walletRepo.findByUserId(user_id);
        if (!wallet) wallet = await this.walletRepo.create(user_id);

        await this._handleWalletInternal(user_id, amount, type, transaction.id);

        await this.walletTxRepo.addTransaction({
          wallet_id: wallet.id,
          transaction_id: transaction.id,
          type,
          amount,
          note: description,
        });

        transaction.markSuccess({ paid_at: new Date().toISOString() });
        await this.transactionRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

        if (related_type === 'chaging_session') {
          const eventType = `payment.charging.succeeded`;
          await this._createOutbox(
            eventType,
            transaction.id,
            {
              user_id: transaction.user_id,
              transaction_id: transaction.id,
              related_id: transaction.related_id,
              related_type: transaction.related_type,
              amount: transaction.amount,
              method: transaction.method,
            }
          );

          try {
            publishEvent(eventType, {
              user_id: transaction.user_id,
              transaction_id: transaction.id,
              related_id: transaction.related_id,
              amount: transaction.amount,
            });
          } catch (err) { }
        }
      } catch (err) {
        transaction.markFailed({ reason: err.message });
        await this.transactionRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

        await this._createOutbox(
          `payment.${type}.failed`,
          transaction.id,
          {
            user_id,
            transaction_id: transaction.id,
            amount,
            reason: err.message,
          }
        );
      }
    }

    return transaction;
  }

  async _applyWalletTopup({ user_id, amount }) {
    await this._handleWalletInternal(user_id, amount, 'topup');
  }

  async _applyWalletRefund({ user_id, amount, transaction_id }) {
    if (!transaction_id) throw new Error("transaction_id required for refund");

    const transaction = await this.transactionRepo.findById(transaction_id);
    if (!transaction || transaction.refunded) return;

    try {
      await this._handleWalletInternal(user_id, amount, "refund", transaction_id);

      transaction.markRefunded({ refunded_at: new Date().toISOString() });
      await this.transactionRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

      localBus.publish("payment.refund.success", {
        user_id,
        amount,
        transaction_id,
      });

    } catch (err) {
      await this._createOutbox(
        "payment.refund.retry",
        transaction_id,
        { user_id, amount },
        "failed"
      );
    }
  }

  async processOutboxEvents(limit = 50) {
    const events = await this.outboxRepo.findPending(limit);
    if (!events.length) return;

    await initRabbitConnection().catch((err) => {
      console.error('[Outbox] initRabbitConnection failed', err);
    });

    for (const evt of events) {
      let payload;
      try {
        payload = JSON.parse(evt.payload);
      } catch (e) {
        await this.outboxRepo.markAsFailed(evt.id);
        continue;
      }

      try {
        publishEvent(evt.type, payload);

        if (evt.type === 'payment.refund.retry') {
          try {
            await this._applyWalletRefund({
              user_id: payload.user_id,
              amount: payload.amount,
              transaction_id: evt.aggregate_id
            });
          } catch (err) {
            console.error('[Outbox] refund retry failed on apply:', err);
          }
        }

        await this.outboxRepo.markAsProcessed(evt.id);
      } catch (err) {
        await this.outboxRepo.markAsFailed(evt.id);
      }
    }
  }

  async retryFailedRefunds(limit = 50) {
    const events = await this.outboxRepo.findFailed('payment.refund.retry', limit);
    if (!events.length) return;

    for (const evt of events) {
      let payload;
      try {
        payload = JSON.parse(evt.payload);
      } catch {
        continue;
      }

      try {
        await this._applyWalletRefund({
          user_id: payload.user_id,
          amount: payload.amount,
          transaction_id: evt.aggregate_id
        });
        await this.outboxRepo.markAsProcessed(evt.id);
      } catch (err) { }
    }
  }

  async confirmCashPayment(transaction_id) {
    const transaction = await this.transactionRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    if (transaction.related_type !== 'charging_session' && transaction.related_type !== 'guest_charging')
      throw Object.assign(new Error('Only charging transactions supported'), { status: 400 });

    transaction.markSuccess({ confirmed_at: new Date().toISOString() });
    await this.transactionRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    const eventType = `payment.charging.succeeded`;
    await this._createOutbox(
      eventType,
      transaction.id,
      {
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        related_id: transaction.related_id,
        related_type: transaction.related_type,
        amount: transaction.amount,
        method: transaction.method,
      }
    );

    try {
      publishEvent(eventType, {
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        related_id: transaction.related_id,
        amount: transaction.amount,
      });
    } catch (err) { }
    return transaction;
  }

  async processBankWebhook(payload) {
    const maybeCodeCandidates = [];
    if (payload.code) maybeCodeCandidates.push(String(payload.code));
    if (payload.content) maybeCodeCandidates.push(String(payload.content));

    let refCode = null;
    const regex = /(TOP|SUB|BKG|CHG)[A-F0-9]{22}/i;

    for (const text of maybeCodeCandidates) {
      const m = text.match(regex);
      if (m) {
        refCode = m[0].toUpperCase();
        break;
      }
    }

    if (!refCode) throw Object.assign(new Error('Missing referenceCode'), { status: 400 });

    const transaction = await this.transactionRepo.findByReferenceCode(refCode);
    if (!transaction) return { ok: false, reason: 'transaction not found' };

    const incoming = Number(String(payload.transferAmount ?? payload.amount ?? 0).replace(/[,\s]/g, ''));
    if (Number.isNaN(incoming)) return { ok: false, reason: 'invalid amount' };
    if (incoming < Number(transaction.amount)) return { ok: false, reason: 'underpaid' };

    transaction.markSuccess({ webhook: payload, paid_amount: incoming });
    await this.transactionRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    const category = {
      SUB: 'subscription',
      TOP: 'topup',
      BKG: 'booking',
      CHG: 'charging',
    }[refCode.substring(0, 3).toUpperCase()];

    if (category) {
      const eventType = `payment.${category}.succeeded`;
      await this._createOutbox(
        eventType,
        transaction.id,
        {
          user_id: transaction.user_id,
          transaction_id: transaction.id,
          related_id: transaction.related_id,
          related_type: transaction.related_type,
          amount: incoming,
          method: transaction.method,
          reference_code: refCode,
        }
      );

      try {
        publishEvent(eventType, {
          user_id: transaction.user_id,
          transaction_id: transaction.id,
          related_id: transaction.related_id,
          amount: incoming,
        });
      } catch (err) { }
    }

    return {
      ok: true,
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      amount: incoming,
      type: transaction.type,
      reference_code: refCode,
      status: transaction.status,
    };
  }

  async getWalletInfo(user_id) {
    const wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);
    return wallet;
  }

  async listUserPayments(user_id) {
    const list = await this.transactionRepo.listByUser(user_id);
    return list.map((transaction) => (typeof transaction.toJSON === 'function' ? transaction.toJSON() : transaction));
  }

  async getPaymentById(transaction_id) {
    const transaction = await this.transactionRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    return transaction;
  }

  async revenueSummary() {
    return this.transactionRepo.getRevenueSummary();
  }

  async todayRevenue() {
    return this.transactionRepo.getTodayRevenue();
  }

  async dailyRevenue(days = 30) {
    return this.transactionRepo.getDailyRevenue(days);
  }

  async monthlyRevenue(months = 12) {
    return this.transactionRepo.getMonthlyRevenue(months);
  }

  async revenueByType() {
    return this.transactionRepo.getRevenueByType();
  }

  async getTotalTransactions() {
    return this.transactionRepo.count({ status: 'completed' });
  }

  /** Chi phí sạc hàng tháng của từng user */
  async getUserMonthlyChargingCost(user_id, months = 12) {
    return this.transactionRepo.getUserMonthlyChargingCost(user_id, months);
  }

  /** Tổng chi phí sạc */
  async getUserChargingTotal(user_id) {
    return this.transactionRepo.getUserChargingTotal(user_id);
  }
}
