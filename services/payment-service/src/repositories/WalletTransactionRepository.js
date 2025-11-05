import db from '../config/db.js';
import WalletTransaction from '../models/WalletTransaction.js';
import BaseRepository from './BaseRepository.js';

export default class WalletTransactionRepository extends BaseRepository {
  constructor() {
    super(WalletTransaction, 'wallet_transactions');
  }

  async addTransaction({ wallet_id, transaction_id = null, type, amount, note = null }) {
    const query = `
      INSERT INTO ${this.tableName}
      (wallet_id, transaction_id, type, amount, note, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
      RETURNING *;
    `;
    const { rows } = await db.query(query, [wallet_id, transaction_id, type, amount, note]);
    return WalletTransaction.fromRow(rows[0]);
  }

  async listByWallet(wallet_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE wallet_id=$1 ORDER BY created_at DESC`,
      [wallet_id]
    );
    return rows.map((r) => WalletTransaction.fromRow(r));
  }

  async findByTransactionId(transaction_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE transaction_id=$1`,
      [transaction_id]
    );
    return rows.map((r) => WalletTransaction.fromRow(r));
  }
}
