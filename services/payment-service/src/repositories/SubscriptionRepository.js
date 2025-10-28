import db from '../config/db.js';
import BaseRepository from './BaseRepository.js';
import Subscription from '../models/Subscription.js';

export default class SubscriptionRepository extends BaseRepository {
  constructor() {
    super(Subscription, 'subscriptions');
  }

  async create({ user_id, plan_id, start_date, end_date, status = 'active' }) {
    const query = `
      INSERT INTO ${this.tableName} (user_id, plan_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [user_id, plan_id, start_date, end_date, status]);
    return new Subscription(rows[0]);
  }

  async cancel(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'cancelled', end_date = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0] ? new Subscription(rows[0]) : null;
  }

  async findActiveByUser(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND status = 'active'`,
      [user_id]
    );
    return rows.map(r => new Subscription(r));
  }

  async findAllByUser(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return rows.map(r => new Subscription(r));
  }
}
