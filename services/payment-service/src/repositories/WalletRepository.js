import db from '../config/db.js';
import Wallet from '../models/Wallet.js';
import BaseRepository from './BaseRepository.js';

export default class WalletRepository extends BaseRepository {
  constructor() {
    super(Wallet, 'wallets');
  }

  async findByUserId(user_id) {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE user_id=$1`, [user_id]);
    return rows[0] ? new this.model(rows[0]) : null;
  }

  async create(user_id) {
    const { rows } = await db.query(
      `INSERT INTO ${this.tableName} (user_id, balance, status, created_at, updated_at)
       VALUES ($1,0,'active',NOW(),NOW()) RETURNING *`,
      [user_id]
    );
    return new this.model(rows[0]);
  }

  async updateBalance(id, balance) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName} SET balance=$2, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id, balance]
    );
    return new this.model(rows[0]);
  }
}
