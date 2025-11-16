import db from '../config/db.js';
import Transaction from '../models/Transaction.js';
import BaseRepository from './BaseRepository.js';

export default class TransactionRepository extends BaseRepository {
  constructor() {
    super(Transaction, 'transactions');
  }

  /** === Tạo giao dịch mới === */
  async create({
    user_id,
    type,
    amount,
    currency = 'VND',
    method,
    related_id = null,
    related_type = null,
    external_id = null,
    reference_code = null,
    status = 'pending',
    meta = {},
  }) {
    const query = `
      INSERT INTO ${this.tableName}
      (user_id, type, amount, currency, method, related_id, related_type, external_id, reference_code, status, meta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      RETURNING *;
    `;
    const values = [
      user_id,
      type,
      amount,
      currency,
      method,
      related_id,
      related_type,
      external_id,
      reference_code,
      status,
      meta,
    ];

    const { rows } = await db.query(query, values);
    return Transaction.fromRow(rows[0]);
  }

  /** === Cập nhật trạng thái === */
  async updateStatus(id, status, meta = {}) {
    const query = `
      UPDATE ${this.tableName}
      SET status = $2, meta = $3::jsonb, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id, status, meta]);
    return rows[0] ? Transaction.fromRow(rows[0]) : null;
  }

  /** === Cập nhật external_id === */
  async updateExternalId(id, external_id) {
    const query = `
      UPDATE ${this.tableName}
      SET external_id = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id, external_id]);
    return rows[0] ? Transaction.fromRow(rows[0]) : null;
  }

  /** === Tìm theo mã tham chiếu === */
  async findByReferenceCode(code) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE reference_code = $1`,
      [code]
    );
    return rows[0] ? Transaction.fromRow(rows[0]) : null;
  }

  /** === Tìm theo external_id === */
  async findByExternalId(external_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE external_id = $1`,
      [external_id]
    );
    return rows[0] ? Transaction.fromRow(rows[0]) : null;
  }

  /** === Tìm theo đối tượng liên quan === */
  async findByRelated(related_id, related_type) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE related_id = $1 AND related_type = $2`,
      [related_id, related_type]
    );
    return rows.map(Transaction.fromRow);
  }

  /** === Lấy toàn bộ giao dịch của user === */
  async listByUser(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );
    return rows.map(Transaction.fromRow);
  }

  // ================= Revenue / Analytics =================

  /** === Tổng doanh thu === */
  async getRevenueSummary() {
    const query = `
      SELECT COALESCE(SUM(amount)::numeric, 0) AS total
      FROM ${this.tableName}
      WHERE status = 'completed'
        AND method IN ('bank_transfer','cash')
    `;
    const { rows } = await db.query(query);
    return Number(rows[0]?.total ?? 0);
  }

  /** === Tổng số giao dịch đã hoàn thành === */
  async getTotalTransactions() {
    const query = `
      SELECT COUNT(*) AS total
      FROM ${this.tableName}
      WHERE status = 'completed'
        AND method IN ('bank_transfer','cash')
    `;
    const { rows } = await db.query(query);
    return Number(rows[0]?.total ?? 0);
  }

  /** === Doanh thu hôm nay === */
  async getTodayRevenue() {
    const query = `
      SELECT COALESCE(SUM(amount)::numeric, 0) AS total
      FROM ${this.tableName}
      WHERE status = 'completed'
        AND DATE(created_at) = CURRENT_DATE
        AND method IN ('bank_transfer','cash')
    `;
    const { rows } = await db.query(query);
    return Number(rows[0]?.total ?? 0);
  }

  /** === Doanh thu hàng ngày (mặc định 30 ngày gần nhất) === */
  async getDailyRevenue(days = 30) {
    const query = `
      SELECT 
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
        COALESCE(SUM(amount)::numeric, 0) AS total
      FROM ${this.tableName}
      WHERE status = 'completed'
        AND created_at >= NOW() - make_interval(days => $1)
        AND method IN ('bank_transfer','cash')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const { rows } = await db.query(query, [days]);
    return rows.reduce((acc, r) => {
      acc[r.date] = Number(r.total ?? 0);
      return acc;
    }, {});
  }

  /** === Doanh thu theo tháng (mặc định 12 tháng gần nhất) === */
  async getMonthlyRevenue(months = 12) {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(amount)::numeric, 0) AS total
      FROM ${this.tableName}
      WHERE status = 'completed'
        AND created_at >= NOW() - make_interval(months => $1)
        AND method IN ('bank_transfer','cash')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;
    const { rows } = await db.query(query, [months]);
    return rows.reduce((acc, r) => {
      acc[r.month] = Number(r.total ?? 0);
      return acc;
    }, {});
  }

  /** === Doanh thu theo type/related_type === */
  async getRevenueByType() {
    const query = `
      SELECT 
        type,
        related_type,
        COALESCE(SUM(amount)::numeric, 0) AS total
      FROM ${this.tableName}
      WHERE status = 'completed'
        AND method IN ('bank_transfer','cash')
      GROUP BY type, related_type
      ORDER BY type, related_type
    `;
    const { rows } = await db.query(query);
    return rows.map(r => ({
      type: r.type,
      related_type: r.related_type,
      total: Number(r.total ?? 0),
    }));
  }
}
