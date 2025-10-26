import db from '../config/db.js';
import Transaction from '../models/Transaction.js';
import BaseRepository from './BaseRepository.js';

export default class TransactionRepository extends BaseRepository {
  constructor() {
    super(Transaction, 'transactions');
  }

  async create(data) {
    const query = `
      INSERT INTO ${this.tableName}
      (user_id, type, amount, currency, method, related_id, external_id, reference_code, status, meta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const values = [
      data.user_id,
      data.type,
      data.amount,
      data.currency || 'VND',
      data.method,
      data.related_id,
      data.external_id,
      data.reference_code,
      data.status || 'pending',
      data.meta || {},
    ];
    const { rows } = await db.query(query, values);
    return new this.model(rows[0]);
  }

  async updateStatus(id, status, meta = {}) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName} SET status=$2, meta=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id, status, meta]
    );
    return rows[0] ? new this.model(rows[0]) : null;
  }

  async updateExternalId(id, external_id) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName}
       SET external_id=$2, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id, external_id]
    );
    return rows[0] ? new this.model(rows[0]) : null;
  }

  async findByReferenceCode(code) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE reference_code=$1`,
      [code]
    );
    return rows[0] ? new this.model(rows[0]) : null;
  }

  async listByUser(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE user_id=$1 ORDER BY created_at DESC`,
      [user_id]
    );
    return rows.map(r => new this.model(r));
  }
}
