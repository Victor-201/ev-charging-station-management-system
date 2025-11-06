export default class WalletTransaction {
  constructor({
    id,
    wallet_id,
    transaction_id = null,
    amount,
    type, // ENUM: 'topup' | 'payment' | 'refund'
    note = null,
    created_at,
    updated_at,
  }) {
    if (!wallet_id) throw new Error('wallet_id is required');
    if (!amount || amount <= 0) throw new Error('amount must be greater than zero');
    if (!['topup', 'payment', 'refund'].includes(type))
      throw new Error(`Invalid wallet transaction type: ${type}`);

    this.id = id;
    this.wallet_id = wallet_id;
    this.transaction_id = transaction_id;
    this.amount = parseFloat(amount);
    this.type = type;
    this.note = note;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  isTopup() {
    return this.type === 'topup';
  }
  isPayment() {
    return this.type === 'payment';
  }
  isRefund() {
    return this.type === 'refund';
  }

  applyTo(wallet) {
    if (!wallet || wallet.id !== this.wallet_id) throw new Error('Invalid wallet reference');
    if (this.isTopup() || this.isRefund()) wallet.increase(this.amount);
    else if (this.isPayment()) wallet.decrease(this.amount);
    wallet.updated_at = new Date();
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      wallet_id: this.wallet_id,
      transaction_id: this.transaction_id,
      amount: this.amount,
      type: this.type,
      note: this.note,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null,
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new WalletTransaction({
      id: row.id,
      wallet_id: row.wallet_id,
      transaction_id: row.transaction_id,
      amount: row.amount,
      type: row.type,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
