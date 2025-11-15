export default class Wallet {
  constructor({
    id,
    user_id,
    balance = 0,
    status = 'active', // ENUM: 'active' | 'suspended' | 'closed'
    created_at,
    updated_at,
    suspend_reason = null,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.balance = parseFloat(balance);
    this.status = status;
    this.suspend_reason = suspend_reason;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  /** === Trạng thái === */
  isActive() {
    return this.status === 'active';
  }
  isSuspended() {
    return this.status === 'suspended';
  }
  isClosed() {
    return this.status === 'closed';
  }

  /** === Kiểm tra & xử lý số dư === */
  canSpend(amount) {
    return this.isActive() && this.balance >= parseFloat(amount);
  }

  increase(amount) {
    if (amount <= 0) throw new Error('Amount must be greater than zero');
    this.balance += parseFloat(amount);
    this.updated_at = new Date();
  }

  decrease(amount) {
    if (!this.canSpend(amount)) throw new Error('Insufficient balance or inactive wallet');
    this.balance -= parseFloat(amount);
    this.updated_at = new Date();
  }

  /** === Quản lý trạng thái === */
  suspend(reason = null) {
    this.status = 'suspended';
    this.suspend_reason = reason;
    this.updated_at = new Date();
  }

  close() {
    this.status = 'closed';
    this.updated_at = new Date();
  }

  /** === JSON Output === */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      balance: this.balance,
      status: this.status,
      suspend_reason: this.suspend_reason || null,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null,
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new Wallet(row);
  }
}

