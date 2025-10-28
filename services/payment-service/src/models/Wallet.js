export default class Wallet {
  constructor({ id, user_id, balance = 0, status = 'active', created_at, updated_at }) {
    this.id = id;
    this.user_id = user_id;
    this.balance = parseFloat(balance);
    this.status = status;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  isActive() {
    return this.status === 'active';
  }

  canSpend(amount) {
    return this.isActive() && this.balance >= amount;
  }

  increase(amount) {
    this.balance += parseFloat(amount);
  }

  decrease(amount) {
    if (!this.canSpend(amount)) throw new Error('Insufficient balance or wallet inactive');
    this.balance -= parseFloat(amount);
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      balance: this.balance,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
