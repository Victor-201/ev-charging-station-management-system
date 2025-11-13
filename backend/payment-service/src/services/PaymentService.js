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

    // Subscribe local events for topup and subscription
    localBus.subscribe('payment.topup.succeeded', payload => this._applyTopup(payload));
    localBus.subscribe('payment.subscription.succeeded', payload => this._applySubscription(payload));

    // Subscribe RabbitMQ events for booking/charging
    this._subscribeToReservationEvents();
  }

  async _subscribeToReservationEvents() {
    await eventBus.connect();
    await eventBus.subscribe('payment.requested', payload => this._handleReservationPayment(payload));
  }

  // ======== Create Transaction ========
  async createTransaction({
    user_id, type, amount, currency = 'VND', method,
    related_id = null, related_type = null, description = ''
  }) {
    amount = Number(amount);
    if (Number.isNaN(amount) || amount <= 0) throw new Error('Invalid amount value');
    if (related_id && !related_type) throw new Error('related_type is required when related_id is provided');

    if (related_type === 'subscription' && related_id) {
      const plan = await this.planRepo.findById(related_id);
      if (!plan) throw new Error(`Plan not found: ${related_id}`);
    }

    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);
    if (method === 'wallet' && !wallet.canSpend(amount)) throw new Error('Insufficient wallet balance');

    const prefixMap = { topup: 'TOP', subscription: 'SUB', booking: 'BKG', charging: 'CHG' };
    const referenceCode = method === 'bank_transfer'
      ? `${prefixMap[related_type] || prefixMap[type] || 'TXN'}${randomUUID().replace(/-/g, '').substring(0, 22).toUpperCase()}`
      : null;

    const transaction = await this.txRepo.create({
      user_id, type, amount, currency, method,
      related_id, related_type, reference_code: referenceCode,
      meta: { description }
    });

    if (method === 'wallet') {
      await this.walletTxRepo.addTransaction({
        wallet_id: wallet.id, transaction_id: transaction.id,
        type: 'payment', amount, note: description
      });
      transaction.markSuccess({ paid_at: new Date().toISOString() });
      await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

      // Local events only for topup/subscription
      if (['topup', 'subscription'].includes(type)) {
        const eventType = `payment.${type}.succeeded`;
        localBus.publish(eventType, { user_id, transaction_id: transaction.id, related_id, related_type: type, amount, method, reference_code: referenceCode });
      }
    }

    return transaction;
  }

  // ======== Confirm Charging Payment at Station ========
  async confirmCashPayment(transaction_id) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    if (transaction.type !== 'charging') throw Object.assign(new Error('Only charging transactions supported'), { status: 400 });

    transaction.markSuccess({ confirmed_at: new Date().toISOString() });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    // Publish charging event via RabbitMQ (non-blocking)
    await eventBus.connect();
    eventBus.channel.publish(
      eventBus.exchange,
      'payment.charging.succeeded',
      Buffer.from(JSON.stringify({
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        related_id: transaction.related_id,
        related_type: 'charging',
        amount: transaction.amount,
        method: transaction.method,
        reference_code: transaction.reference_code
      }))
    );

    return transaction;
  }

  // ======== Process Bank Webhook ========
  async processBankWebhook(payload) {
    const refCode = payload.code || payload.content?.split(' ')[0];
    if (!refCode) throw Object.assign(new Error('Missing referenceCode'), { status: 400 });

    const prefix = refCode.substring(0, 3).toUpperCase();
    const transaction = await this.txRepo.findByReferenceCode(refCode);
    if (!transaction) return { ok: false, reason: 'transaction not found' };

    const incoming = Number(String(payload.transferAmount).replace(/[,\s]/g, ''));
    if (Number.isNaN(incoming)) return { ok: false, reason: 'invalid amount' };
    if (incoming < Number(transaction.amount)) return { ok: false, reason: 'underpaid' };

    transaction.markSuccess({ webhook: payload, paid_amount: incoming });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    const typeMap = { SUB: 'subscription', TOP: 'topup', BKG: 'booking', CHG: 'charging' };
    const category = typeMap[prefix];
    if (category) {
      const eventType = `payment.${category}.succeeded`;
      const eventPayload = {
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        related_id: transaction.related_id,
        related_type: category,
        amount: incoming,
        method: transaction.method,
        reference_code: refCode
      };

      if (['topup', 'subscription'].includes(category)) {
        localBus.publish(eventType, eventPayload);
      } else {
        await eventBus.connect();
        eventBus.channel.publish(eventBus.exchange, eventType, Buffer.from(JSON.stringify(eventPayload)));
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

  // ======== Helpers ========
  async _applyTopup({ user_id, amount }) {
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);
    wallet.increase(amount);
    await this.walletRepo.updateBalance(wallet.id, wallet.balance);
  }

  async _applySubscription({ user_id, amount }) {
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);
    wallet.increase(amount);
    await this.walletRepo.updateBalance(wallet.id, wallet.balance);
  }

  async listUserPayments(user_id) {
    const list = await this.txRepo.listByUser(user_id);
    return list.map(tx => tx.toJSON());
  }

  async getPaymentById(transaction_id) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    return transaction;
  }

  async _handleReservationPayment(payload) {
  const { user_id, type, amount, method, related_id, related_type, meta } = payload;

  try {
    const transaction = await this.createTransaction({
      user_id,
      type,
      amount,
      method,
      related_id,
      related_type,
      description: meta?.description || ''
    });

    console.log(`[PaymentService] Transaction created successfully: ${transaction.id}`);

  } catch (err) {
    console.error(`[PaymentService] Failed to create transaction: ${err.message}`);

    await eventBus.connect();
    const eventType = `payment.${related_type || type}.failed`;
    const eventPayload = {
      user_id,
      related_id,
      related_type,
      amount,
      method,
      reason: err.message,
    };

    eventBus.channel.publish(
      eventBus.exchange,
      eventType,
      Buffer.from(JSON.stringify(eventPayload))
    );
  }
}
}
