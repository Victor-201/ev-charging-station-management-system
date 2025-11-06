import db from '../config/db.js';
import BaseRepository from './BaseRepository.js';
import Subscription from '../models/Subscription.js';

export default class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(Subscription, 'subscriptions');
  }

  /** === Tạo mới subscription === */
  async create({ user_id, plan_id, start_date = new Date(), end_date = null, status = 'active' }) {
    const query = `
      INSERT INTO ${this.tableName} (user_id, plan_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5::subscription_status)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [user_id, plan_id, start_date, end_date, status]);
    return Subscription.fromRow(rows[0]);
  }

  /** === Cập nhật subscription === */
  async updateById(id, fields) {
    const allowed = ['plan_id', 'start_date', 'end_date', 'status'];
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
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

  /** === Hủy subscription === */
  async cancel(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'cancelled', end_date = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

  /** === Đánh dấu subscription hết hạn === */
  async expire(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'expired', end_date = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

  /** === Lấy các subscription đang active của user === */
  async findActiveByUser(user_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows.map((r) => Subscription.fromRow(r));
  }

  /** === Lấy toàn bộ subscription của user === */
  async findAllByUser(user_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows.map((r) => Subscription.fromRow(r));
  }
}
