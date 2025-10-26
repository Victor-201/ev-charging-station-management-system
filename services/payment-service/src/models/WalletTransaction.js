export default class WalletTransaction {
  constructor({
    id,
    wallet_id,
    transaction_id = null,
    amount,
    type,
    note = null,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.wallet_id = wallet_id;
    this.transaction_id = transaction_id;
    this.amount = parseFloat(amount);
    this.type = type;
    this.note = note;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  toJSON() {
    return {
      id: this.id,
      wallet_id: this.wallet_id,
      transaction_id: this.transaction_id,
      amount: this.amount,
      type: this.type,
      note: this.note,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
