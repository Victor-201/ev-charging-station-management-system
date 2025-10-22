import { TransactionModel as TM } from '../models/TransactionModel.js';

export const PaymentService = {
  async createTransaction({ user_id, amount, method, session_id = null, description = '' }) {
    let referenceCode = null;
    let status = 'pending';

    if (method === 'wallet') status = 'success'; // ví thanh toán ngay
    if (method === 'bank') referenceCode = `EV${Date.now()}${Math.floor(Math.random() * 10000)}`;
    if (method === 'cash') status = 'pending'; // xác nhận tại quầy

    const tx = await TM.create({
      external_id: null,
      user_id,
      session_id,
      amount,
      currency: 'VND',
      method,
      status,
      meta: { referenceCode, description }
    });

    const result = { transaction_id: tx.id, amount, method, status };
    if (referenceCode) result.referenceCode = referenceCode;

    return result;
  },

  async processBankWebhook({ provider, payload }) {
    try {
      console.log('=== SePay Webhook received ===', provider, payload);

      const refCode = payload.code || payload.content?.split(' ')[0];
      if (!refCode) {
        throw Object.assign(new Error('Cannot determine referenceCode from webhook'), { status: 400 });
      }

      const tx = await TM.findByReferenceCode(refCode);
      if (!tx) {
        console.log(`[BACKEND NOTICE] Transaction not found for referenceCode: ${refCode}`);
        return { ok: false, reason: 'transaction not found' };
      }

      const incoming = Number(String(payload.transferAmount).replace(/[,\s]/g, ''));
      const expected = Number(tx.amount);

      if (Number.isNaN(incoming)) {
        console.log(`[BACKEND NOTICE] Invalid transferAmount: ${payload.transferAmount}`);
        return { ok: false, reason: 'invalid transfer amount', transaction_id: tx.id };
      }

      // 4. Kiểm tra thiếu tiền
      if (incoming < expected) {
        console.warn(`[BACKEND NOTICE] Transaction underpaid: expected ${expected}, got ${incoming}`);
        return { ok: false, reason: 'amount underpaid', transaction_id: tx.id };
      }

      // 5. Cập nhật trạng thái thành công
      await TM.updateStatus(tx.id, 'success', { webhook: payload });
      console.log(`[BACKEND NOTICE] Payment success for tx ${tx.id}, user ${tx.user_id}, amount ${incoming}`);

      return { ok: true, transaction_id: tx.id, user_id: tx.user_id, amount: incoming, status: 'success' };
    } catch (err) {
      console.error('[BACKEND NOTICE] Error processing webhook:', err);
      return { ok: false, reason: 'internal error', error: err.message };
    }
  },

  async confirmCashPayment(transaction_id) {
    const tx = await TM.findById(transaction_id);
    if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    await TM.updateStatus(tx.id, 'success', { confirmed_at: new Date() });
    return tx;
  },

  async refundPayment(transaction_id, { amount = null, reason }) {
    const tx = await TM.findById(transaction_id);
    if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    await TM.updateStatus(tx.id, 'refunded', { refund_requested: { amount, reason } });
    return await TM.findById(tx.id);
  },

  async getPaymentById(transaction_id) {
    return await TM.findById(transaction_id);
  }
};

export default PaymentService;
