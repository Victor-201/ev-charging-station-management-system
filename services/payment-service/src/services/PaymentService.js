import TransactionRepository from '../repositories/TransactionRepository.js';
import WalletRepository from '../repositories/WalletRepository.js';
import WalletTransactionRepository from '../repositories/WalletTransactionRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import eventBus from '../core/EventBus.js';
import { randomUUID } from 'crypto';

/**
 * PaymentService
 * ------------------------------
 * Chịu trách nhiệm xử lý toàn bộ logic liên quan đến thanh toán:
 *  - Tạo giao dịch (ví hoặc ngân hàng)
 *  - Nạp/rút ví
 *  - Hoàn tiền (refund)
 *  - Xử lý webhook từ ngân hàng
 */
export default class PaymentService {
  constructor() {
    this.txRepo = new TransactionRepository();
    this.walletRepo = new WalletRepository();
    this.walletTxRepo = new WalletTransactionRepository();
    this.planRepo = new PlanRepository();
  }

  /**
   * Tạo giao dịch mới
   * ------------------------------
   */
  async createTransaction({
    user_id,
    type,
    amount,
    currency = 'VND',
    method,
    related_id = null,
    description = '',
  }) {

    amount = Number(amount);
    if (Number.isNaN(amount) || amount <= 0)
      throw new Error('Invalid amount value');

    // Validate loại giao dịch cần có liên kết đối tượng
    if (['SUBSCRIPTION', 'CHARGING'].includes(type) && !related_id) {
      throw new Error(`${type} transaction requires related_id`);
    }

    // Kiểm tra gói (nếu là SUBSCRIPTION)
    if (type === 'SUBSCRIPTION' && related_id) {
      const plan = await this.planRepo.findById(related_id);
      if (!plan) throw new Error(`Plan not found: ${related_id}`);
    }

    // Đảm bảo ví tồn tại
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    // Kiểm tra số dư nếu thanh toán bằng ví
    if (method === 'wallet' && !wallet.canSpend(amount)) {
      throw new Error('Insufficient wallet balance');
    }

    // --- Sinh mã tham chiếu ---
    let referenceCode = null;
    if (method === 'bank') {
      const prefixMap = {
        TOPUP: 'TOP',
        SUBSCRIPTION: 'SUB',
        CHARGING: 'CHG',
      };
      const prefix = prefixMap[type];
      const shortId = randomUUID().replace(/-/g, '').substring(0, 22).toUpperCase();
      referenceCode = `${prefix}${shortId}`;
    }

    // --- Tạo bản ghi giao dịch ---
    let transaction = await this.txRepo.create({
      user_id,
      type,
      amount,
      currency,
      method,
      related_id,
      reference_code: referenceCode,
      meta: { description },
    });

    // --- Nếu thanh toán bằng ví ---
    if (method === 'wallet') {
      await this.walletTxRepo.addTransaction({
        wallet_id: wallet.id,
        transaction_id: transaction.id,
        type: 'PAYMENT',
        amount,
        note: description,
      });

      transaction.markSuccess({ paid_at: new Date() });
      await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);
    }

    return transaction;
  }

  /**
   * Xác nhận giao dịch tiền mặt (manual confirm)
   * ------------------------------
   */
  async confirmCashPayment(transaction_id) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    transaction.markSuccess({ confirmed_at: new Date() });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    return transaction;
  }

  /**
   * Xử lý webhook thanh toán từ ngân hàng
   * ------------------------------
   */
  async processBankWebhook({ payload }) {
    const refCode =
      payload.reference_code ||
      payload.content?.split(' ')[0];

    if (!refCode)
      throw Object.assign(new Error('Missing referenceCode in payload'), {
        status: 400,
      });

    const prefix = refCode.substring(0, 3).toUpperCase();

    // --- Tìm giao dịch ---
    const transaction = await this.txRepo.findByReferenceCode(refCode);
    if (!transaction) return { ok: false, reason: 'transaction not found' };

    // --- Xác thực số tiền ---
    const incoming = Number(String(payload.transferAmount).replace(/[,\s]/g, ''));
    if (Number.isNaN(incoming)) return { ok: false, reason: 'invalid amount' };
    if (incoming < transaction.amount)
      return { ok: false, reason: 'underpaid' };

    // --- Lưu external ID ---
    if (payload.id) {
      await this.txRepo.updateExternalId(transaction.id, payload.id);
    }

    // --- Đánh dấu thành công ---
    transaction.markSuccess({ webhook: payload });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    // --- Hành động theo prefix ---
    switch (prefix) {
      case 'TOP': {
        let wallet = await this.walletRepo.findByUserId(transaction.user_id);
        if (!wallet) wallet = await this.walletRepo.create(transaction.user_id);

        await this.walletTxRepo.addTransaction({
          wallet_id: wallet.id,
          transaction_id: transaction.id,
          type: 'TOPUP',
          amount: incoming,
          note: `Bank: ${payload.gateway || 'unknown'}`,
        });
        break;
      }

      case 'SUB': {
        // Thanh toán gói thành công → phát sự kiện
        eventBus.emit('payment.succeeded', {
          user_id: transaction.user_id,
          type: transaction.type,
          related_id: transaction.related_id,
          amount: incoming,
          method: transaction.method,
          reference_code: transaction.reference_code,
        });
        break;
      }

      case 'CHG': {
        // (dự phòng cho charging)
        break;
      }

      default: {
        console.warn(`Unknown payment prefix: ${prefix}`);
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

  /**
   * Hoàn tiền
   * ------------------------------
   */
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
      type: 'REFUND',
      amount: refundAmount,
      note: reason,
    });

    transaction.markRefunded({ amount: refundAmount, reason });
    await this.txRepo.updateStatus(transaction.id, transaction.status, transaction.meta);

    return transaction;
  }

  /**
   * Lấy thông tin ví người dùng
   * ------------------------------
   */
  async getWalletInfo(user_id) {
    const wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) throw Object.assign(new Error('Wallet not found'), { status: 404 });
    return wallet;
  }

  /**
   * Nạp tiền vào ví thủ công
   * ------------------------------
   */
  async topupWallet({ user_id, amount }) {
    let wallet = await this.walletRepo.findByUserId(user_id);
    if (!wallet) wallet = await this.walletRepo.create(user_id);

    wallet.increase(amount);
    await this.walletRepo.updateBalance(wallet.id, wallet.balance);

    const walletTx = await this.walletTxRepo.addTransaction({
      wallet_id: wallet.id,
      type: 'TOPUP',
      amount,
      note: 'Manual top-up',
    });

    return { message: 'Wallet topped up successfully', transaction: walletTx };
  }

  /**
   * Liệt kê tất cả giao dịch của user
   * ------------------------------
   */
  async listUserPayments(user_id) {
    const list = await this.txRepo.listByUser(user_id);
    return list.map(tx => tx.toJSON());
  }

  /**
   * Lấy chi tiết giao dịch
   * ------------------------------
   */
  async getPaymentById(transaction_id) {
    const transaction = await this.txRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    return transaction;
  }
}
