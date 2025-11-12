// repositories/BaseRepository.js
import db from '../config/db.js';

export default class BaseRepository {
  constructor(model, tableName) {
    if (!model || !tableName)
      throw new Error('Model and tableName are required');
    this.model = model;
    this.tableName = tableName;
  }

  /** === Tìm bản ghi theo ID === */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? new this.model(rows[0]) : null;
  }

  /** === Lấy toàn bộ bản ghi === */
  async findAll() {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    return rows.map((r) => new this.model(r));
  }

  /** === Xóa bản ghi theo ID === */
  async deleteById(id) {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return true;
  }

  /** === Đếm tổng số bản ghi === */
  async count() {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS total FROM ${this.tableName}`
    );
    return parseInt(rows[0].total, 10);
  }
}
