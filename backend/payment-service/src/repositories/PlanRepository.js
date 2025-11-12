import db from '../config/db.js';
import BaseRepository from './BaseRepository.js';
import Plan from '../models/Plan.js';

export default class PlanRepository extends BaseRepository {
  constructor() {
    super(Plan, 'plans');
  }

  /** === Tạo gói mới === */
  async create({ name, description, type = 'basic', price = 0, duration = null, duration_days = null }) {
    const query = `
      INSERT INTO ${this.tableName} (name, description, type, price, duration, duration_days)
      VALUES ($1, $2, $3::plan_type, $4, $5, $6)
      RETURNING *;
    `;
    const values = [name, description, type, price, duration, duration_days];
    const { rows } = await db.query(query, values);
    return Plan.fromRow(rows[0]);
  }

  /** === Lấy danh sách tất cả gói === */
  async findAll() {
    const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC;`;
    const { rows } = await db.query(query);
    return rows.map((r) => Plan.fromRow(r));
  }

  /** === Cập nhật gói === */
  async updateById(id, fields) {
    const allowed = ['name', 'description', 'type', 'price', 'duration', 'duration_days'];
    const entries = Object.entries(fields).filter(([k, v]) => allowed.includes(k) && v !== undefined);
    if (entries.length === 0) return this.findById(id);

    const setClause = entries
      .map(([key], i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = entries.map(([, v]) => v);

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id, ...values]);
    return rows[0] ? Plan.fromRow(rows[0]) : null;
  }

  /** === Xóa gói === */
  async deleteById(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? Plan.fromRow(rows[0]) : null;
  }

  /** === Tìm gói theo loại (basic/standard/premium) === */
  async findByType(type) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE type = $1::plan_type
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [type]);
    return rows.map((r) => Plan.fromRow(r));
  }
}