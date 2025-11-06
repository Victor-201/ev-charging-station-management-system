// repositories/InvoiceRepository.js
import db from '../config/db.js';
import Invoice from '../models/Invoice.js';
import BaseRepository from './BaseRepository.js';

export default class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice, 'invoices');
  }

  /** === Tạo hóa đơn mới === */
  async create({ transaction_id = null, user_id, total_amount, due_date = null, status = 'unpaid' }) {
    const query = `
      INSERT INTO ${this.tableName} (transaction_id, user_id, total_amount, due_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [transaction_id, user_id, total_amount, due_date, status];
    const { rows } = await db.query(query, values);
    return new this.model(rows[0]);
  }

  /** === Tìm hóa đơn theo ID === */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? new this.model(rows[0]) : null;
  }

  /** === Lấy tất cả hóa đơn === */
  async findAll() {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows.map(r => new this.model(r));
  }

  /** === Lấy hóa đơn theo transaction_id === */
  async findByTransactionId(transaction_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE transaction_id = $1 LIMIT 1`,
      [transaction_id]
    );
    return rows[0] ? new this.model(rows[0]) : null;
  }

  /** === Lấy nhiều hóa đơn theo danh sách transaction_id === */
  async findByTransactionIds(transactionIds) {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) return [];
    const placeholders = transactionIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT * FROM ${this.tableName} WHERE transaction_id IN (${placeholders})`;
    const { rows } = await db.query(query, transactionIds);
    return rows.map(r => new this.model(r));
  }

  /** === Cập nhật trạng thái hóa đơn === */
  async updateStatus(id, status) {
    const { rows } = await db.query(
      `UPDATE ${this.tableName} 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return rows[0] ? new this.model(rows[0]) : null;
  }

  /** === Lấy danh sách hóa đơn của user === */
  async listByUser(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return rows.map(r => new this.model(r));
  }

  /** === Lấy danh sách hóa đơn quá hạn chưa thanh toán === */
  async findOverdue() {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} 
       WHERE due_date < NOW() AND status = 'unpaid' 
       ORDER BY due_date ASC`
    );
    return rows.map(r => new this.model(r));
  }

  /** === Cập nhật trạng thái tất cả hóa đơn quá hạn thành 'overdue' === */
  async markOverdueInvoices() {
    const { rows } = await db.query(
      `UPDATE ${this.tableName} 
       SET status = 'overdue', updated_at = NOW() 
       WHERE due_date < NOW() AND status = 'unpaid' 
       RETURNING *`
    );
    return rows.map(r => new this.model(r));
  }

  /** === Xóa hóa đơn theo ID === */
  async deleteById(id) {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return true;
  }

  /** === Đếm tổng số hóa đơn === */
  async count() {
    const { rows } = await db.query(`SELECT COUNT(*) AS total FROM ${this.tableName}`);
    return parseInt(rows[0].total, 10);
  }
}
