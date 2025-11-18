import BaseRepository from './BaseRepository.js';
import EventOutbox from '../models/EventOutbox.js';
import db from '../config/db.js';

export default class EventOutboxRepository extends BaseRepository {
  constructor() {
    super(EventOutbox, 'event_outbox');
  }

  /** === Tạo event mới trong outbox === */
  async create(eventData) {
    const event = new EventOutbox(eventData);
    const query = `
      INSERT INTO ${this.tableName} (
        aggregate_type, aggregate_id, type, payload, status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      event.aggregate_type,
      event.aggregate_id,
      event.type,
      event.payload,
      event.status,
    ];

    const { rows } = await db.query(query, values);
    return new this.model(rows[0]);
  }

  /** === Lấy danh sách event còn pending để publish === */
  async findPending(limit = 50) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT $1;
    `;
    const { rows } = await db.query(query, [limit]);
    return rows.map((r) => new this.model(r));
  }

    /** === Lấy danh sách event failed theo type để retry === */
  async findFailed(type, limit = 50) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'failed' AND type = $1
      ORDER BY updated_at ASC
      LIMIT $2;
    `;
    const { rows } = await db.query(query, [type, limit]);
    return rows.map((r) => new this.model(r));
  }

  /** === Tìm event theo id (helper) === */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1;`;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? new this.model(rows[0]) : null;
  }

  /** === Cập nhật trạng thái event === */
  async updateStatus(id, status) {
    const query = `
      UPDATE ${this.tableName}
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id, status]);
    return rows[0] ? new this.model(rows[0]) : null;
  }

  /** === Đánh dấu đã publish thành công === */
  async markAsProcessed(id) {
    return this.updateStatus(id, 'processed');
  }

  /** === Đánh dấu publish thất bại === */
  async markAsFailed(id) {
    return this.updateStatus(id, 'failed');
  }

  /** === Xóa event đã publish lâu hơn N ngày === */
  async cleanupProcessed(olderThanDays = 7) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE status = 'processed'
      AND created_at < NOW() - INTERVAL '${olderThanDays} days';
    `;
    await db.query(query);
    return true;
  }
}
