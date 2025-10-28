import db from '../config/db.js';
import Invoice from '../models/Invoicel.js';
import BaseRepository from './BaseRepository.js';

export default class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice, 'invoices');
  }

  async create({ transaction_id, user_id, total_amount, due_date = null, status = 'unpaid' }) {
    const query = `
      INSERT INTO ${this.tableName} (transaction_id, user_id, total_amount, due_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [transaction_id, user_id, total_amount, due_date, status];
    const { rows } = await db.query(query, values);
    return new Invoice(rows[0]);
  }

  async findByTransactionId(transaction_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE transaction_id = $1`,
      [transaction_id]
    );
    return rows[0] ? new Invoice(rows[0]) : null;
  }

  async updateStatus(id, status) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName} 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0] ? new Invoice(rows[0]) : null;
  }

  async listByUser(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return rows.map(r => new Invoice(r));
  }
}
