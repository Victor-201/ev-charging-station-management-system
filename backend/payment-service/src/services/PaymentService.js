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

    // LocalBus: subscribe những event internal mà service cần xử lý
    // Đồng bộ với chỗ publish: processBankWebhook publish "payment.<category>.succeeded"
    localBus.subscribe('payment.topup.succeeded', p => this._applyWalletTopup(p));
    // 'payment.refund' dùng như request refund (có thể publish từ trong service khác)
    localBus.subscribe('payment.refund', p => this._applyWalletRefund(p));

    // Outbox retry intervals (bắt lỗi bên trong để interval tiếp tục chạy)
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
    }, 60 * 1000); // retry refund mỗi phút
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

    // giả sử Wallet model có các method canSpend, decrease, increase
    if (action === 'payment') {
      if (!wallet.canSpend(amount)) throw new Error('Insufficient wallet balance');
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

    // đảm bảo wallet tồn tại (nhưng không thao tác balance trừ khi method === 'wallet')
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    const prefixMap = { topup: 'TOP', subscription: 'SUB', booking: 'BKG', charging: 'CHG' };
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
        wallet = await this.walletRepo.findByUserId(user_id);
        if (!wallet) throw new Error('Wallet not found');

        await this._handleWalletInternal(user_id, amount, 'payment', transaction.id);
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
    // payload có thể chứa thêm transaction_id — ignore nếu không cần
    await this._handleWalletInternal(user_id, amount, 'topup');
    // có thể ghi walletTx nếu cần: walletTxRepo.addTransaction(...)
  }

  /** === Áp dụng Wallet Refund (LocalBus) === */
  async _applyWalletRefund({ user_id, amount, transaction_id }) {
    if (!transaction_id) throw new Error('transaction_id is required for refund');

    const tx = await this.txRepo.findById(transaction_id);
    if (!tx) return; // transaction không tồn tại
    if (tx.refunded) return; // tránh duplicate refund, giả sử tx.refunded boolean

    try {
      await this._handleWalletInternal(user_id, amount, 'refund', transaction_id);
      tx.markRefunded({ refunded_at: new Date().toISOString() });
      await this.txRepo.updateStatus(tx.id, tx.status, tx.meta);

      // LocalBus internal event chỉ log
      localBus.publish('payment.refund.success', { user_id, amount, transaction_id });

    } catch (err) {
      // Outbox retry cho refund thất bại
      await this._createOutbox('payment.refund.retry', transaction_id, { user_id, amount }, 'failed');
    }
  }

  /** === Xử lý Outbox retry === */
  async processOutboxEvents(limit = 50) {
    const events = await this.outboxRepo.findPending(limit);
    if (!events || events.length === 0) return;

    // Connect một lần
    try {
      await eventBus.connect();
    } catch (err) {
      console.error('eventBus connect failed', err);
      // nếu không connect được, ta không publish nhưng vẫn có thể xử lý retry-local events
    }

    for (const evt of events) {
      let payload;
      try {
        payload = JSON.parse(evt.payload);
      } catch (err) {
        // payload invalid -> mark failed and continue
        await this.outboxRepo.markAsFailed(evt.id);
        continue;
      }

      const tx = await this.txRepo.findById(evt.aggregate_id);

      // Nếu transaction đã ở trạng thái cuối (ví dụ completed/succeeded/refunded), mark processed và skip
      const finalizedStates = ['completed', 'succeeded', 'failed', 'refunded']; // tùy app: điều chỉnh nếu model khác
      if (!tx || finalizedStates.includes(tx.status)) {
        await this.outboxRepo.markAsProcessed(evt.id);
        continue;
      }

      try {
        // Publish events to eventBus nếu là cross-service event
        if (eventBus.channel && evt.type) {
          // eventBus API có thể khác — đây là cách an toàn: giả sử eventBus.channel.publish(exchange, routingKey, payloadBuffer)
          try {
            eventBus.channel.publish(eventBus.exchange, evt.type, Buffer.from(evt.payload));
          } catch (pubErr) {
            // Nếu publish thất bại, ném ra để mark failed
            throw pubErr;
          }
        }

        // xử lý một số loại outbox nội bộ
        if (evt.type === 'payment.refund.retry') {
          // payload expected: { user_id, amount }
          await this._applyWalletRefund({ user_id: payload.user_id, amount: payload.amount, transaction_id: evt.aggregate_id });
        }

        await this.outboxRepo.markAsProcessed(evt.id);
      } catch (err) {
        // mark failed để retry lần sau
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
        // bỏ event nếu payload corrupt
        continue;
      }
      try {
        await this._applyWalletRefund({ user_id: payload.user_id, amount: payload.amount, transaction_id: evt.aggregate_id });
        await this.outboxRepo.markAsProcessed(evt.id);
      } catch (err) {
        // giữ failed để retry lần sau
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
    // tìm reference code bằng regex: prefix (TOP|SUB|BKG|CHG) + 22 hex chars (chiều dài theo tạo refCode ở createTransaction)
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

    // map prefix -> category
    const category = {
      SUB: 'subscription',
      TOP: 'topup',
      BKG: 'booking',
      CHG: 'charging'
    }[refCode.substring(0, 3).toUpperCase()];

    if (category) {
      const eventType = `payment.${category}.succeeded`;
      // tạo outbox đã processed (hoặc pending tuỳ business requirement) — ở đây đánh dấu 'processed' vì webhook là nguồn authoritive
      await this._createOutbox(eventType, transaction.id, {
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        related_id: transaction.related_id,
        related_type: category,
        amount: incoming,
        method: transaction.method,
        reference_code: refCode
      }, 'processed');

      // nếu cần xử lý nội bộ (topup => cộng vào wallet)
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