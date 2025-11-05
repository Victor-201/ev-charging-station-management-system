import db from '../config/db.js';
import Wallet from '../models/Wallet.js';
import BaseRepository from './BaseRepository.js';

export default class WalletRepository extends BaseRepository {
  constructor() {
    super(Wallet, 'wallets');
  }

  async findByUserId(user_id) {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE user_id=$1`, [user_id]);
    return Wallet.fromRow(rows[0]);
  }

  async create(user_id) {
    const { rows } = await db.query(
      `INSERT INTO ${this.tableName} (user_id, balance, status, created_at, updated_at)
       VALUES ($1,0,'active',NOW(),NOW()) RETURNING *`,
      [user_id]
    );
    return Wallet.fromRow(rows[0]);
  }

  async updateBalance(id, newBalance) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName} 
       SET balance=$2, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, newBalance]
    );
    return Wallet.fromRow(rows[0]);
  }

  /** === Cộng số dư (atomic) === */
  async increaseBalance(id, amount) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName}
       SET balance = balance + $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, amount]
    );
    return Wallet.fromRow(rows[0]);
  }

  /** === Trừ số dư (atomic) === */
  async decreaseBalance(id, amount) {
    const query = `
      UPDATE ${this.tableName}
      SET balance = balance - $2, updated_at = NOW()
      WHERE id = $1 AND balance >= $2
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id, amount]);
    return rows[0] ? Wallet.fromRow(rows[0]) : null; // null = không đủ tiền
  }

  async suspend(id, reason = null) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName}
       SET status='suspended', suspend_reason=$2, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, reason]
    );
    return Wallet.fromRow(rows[0]);
  }

  async close(id) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName}
       SET status='closed', updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id]
    );
    return Wallet.fromRow(rows[0]);
  }

  async getBalance(user_id) {
    const wallet = await this.getWalletByUser(user_id);
    return {
      user_id,
      balance: wallet.balance,
      status: wallet.status,
      updated_at: wallet.updated_at
    };
  }
}
