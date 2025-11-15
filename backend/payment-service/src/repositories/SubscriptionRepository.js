import db from '../config/db.js';
import BaseRepository from './BaseRepository.js';
import Subscription from '../models/Subscription.js';

export default class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(Subscription, 'subscriptions');
  }

  async create({ user_id, plan_id, start_date = new Date(), end_date = null, status = 'pending' }) {
    const query = `
      INSERT INTO ${this.tableName} (user_id, plan_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5::subscription_status)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [
      user_id,
      plan_id,
      start_date,
      end_date,
      status
    ]);
    return Subscription.fromRow(rows[0]);
  }

  async updateById(id, fields) {
    const allowed = ['plan_id', 'start_date', 'end_date', 'status'];
    const entries = Object.entries(fields).filter(
      ([k, v]) => allowed.includes(k) && v !== undefined
    );

    if (entries.length === 0) return this.findById(id);

    const setClause = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
    const values = entries.map(([_, v]) => v);

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await db.query(query, [id, ...values]);
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

  async setActive(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'active', updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

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

  /** NEW: Active + Plan */
  async findActiveByUserAndPlan(user_id, plan_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND plan_id = $2 AND status = 'active'
      ORDER BY created_at DESC LIMIT 1;
    `;
    const { rows } = await db.query(query, [user_id, plan_id]);
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

  /** NEW: Pending + Plan */
  async findPendingByUserAndPlan(user_id, plan_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND plan_id = $2 AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1;
    `;
    const { rows } = await db.query(query, [user_id, plan_id]);
    return rows[0] ? Subscription.fromRow(rows[0]) : null;
  }

  async findActiveByUser(user_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows.map(Subscription.fromRow);
  }

  async findPendingByUser(user_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND status = 'pending'
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows.map(Subscription.fromRow);
  }

  async findAllByUser(user_id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await db.query(query, [user_id]);
    return rows.map(Subscription.fromRow);
  }
}
