import db from '../config/db.js';

export const WalletModel = {
  // For simplicity assume wallet_id == user_id as basic internal wallet
  async getBalance(user_id) {
    // compute balance from wallet_transactions
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN type IN ('topup','refund') THEN amount WHEN type='charge' THEN -amount ELSE 0 END),0) AS balance FROM wallet_transactions WHERE user_id=$1`,
      [user_id]
    );
    return Number(rows[0].balance || 0);
  },
  async addTransaction({ wallet_id, user_id, type, amount, reference_id=null }) {
    // get previous balance
    const balance = await this.getBalance(user_id);
    const balance_after = (type === 'charge') ? balance - amount : balance + amount;
    const { rows } = await db.query(
      `INSERT INTO wallet_transactions (wallet_id,user_id,type,amount,balance_after,reference_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [wallet_id, user_id, type, amount, balance_after, reference_id]
    );
    return rows[0];
  }
};
