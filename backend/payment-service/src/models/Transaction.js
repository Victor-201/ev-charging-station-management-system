// src/models/Transaction.js
export default class Transaction {
  constructor({
    id,
    user_id,
    type,                  // ENUM: 'topup' | 'payment' | 'refund'
    amount,
    currency = 'VND',
    method,                // ENUM: 'wallet' | 'bank_transfer' | 'cash'
    related_id = null,
    related_type = null,   // ENUM: 'subscription' | 'booking' | 'charging_session' | 'guest_charging'
    external_id = null,
    reference_code = null,
    status = 'pending',    // ENUM: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
    meta = {},
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.type = type;
    this.amount = typeof amount === 'number' ? amount : parseFloat(amount);
    this.currency = currency;
    this.method = method;
    this.related_id = related_id;
    this.related_type = related_type;
    this.external_id = external_id;
    this.reference_code = reference_code;
    this.status = status;
    this.meta = meta || {};
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  /** Kiểm tra trạng thái giao dịch */
  isPending() {
    return this.status === 'pending';
  }

  isCompleted() {
    return this.status === 'completed';
  }

  isFailed() {
    return this.status === 'failed';
  }

  isCancelled() {
    return this.status === 'cancelled';
  }

  isRefunded() {
    return this.status === 'refunded';
  }

  /** Cập nhật trạng thái */
  markSuccess(extraMeta = {}) {
    this.status = 'completed';
    this.meta = { ...this.meta, ...extraMeta };
    this.updated_at = new Date();
  }

  markFailed(reason) {
    this.status = 'failed';
    this.meta = { ...this.meta, reason };
    this.updated_at = new Date();
  }

  markCancelled(reason = null) {
    this.status = 'cancelled';
    if (reason) this.meta = { ...this.meta, cancelled_reason: reason };
    this.updated_at = new Date();
  }

  // Hoàn tiền
  markRefunded(extraMeta = {}) {
    this.status = 'refunded';
    this.meta = { ...this.meta, ...extraMeta };
    this.updated_at = new Date();
  }

  /** Trả về JSON chuẩn hóa */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      method: this.method,
      related_id: this.related_id,
      related_type: this.related_type,
      external_id: this.external_id,
      reference_code: this.reference_code,
      status: this.status,
      meta: this.meta,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null,
    };
  }

  /** Tạo instance từ PostgreSQL row */
  static fromRow(row) {
    if (!row) return null;
    return new Transaction({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      method: row.method,
      related_id: row.related_id,
      related_type: row.related_type,
      external_id: row.external_id,
      reference_code: row.reference_code,
      status: row.status,
      meta: row.meta,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
