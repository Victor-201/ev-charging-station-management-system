import db from '../config/db.js';

export const SubscriptionModel = {
  async create({ user_id, plan_id, start_date, end_date, status = 'active' }) {
    const { rows } = await db.query(
      `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, plan_id, start_date, end_date, status]
    );
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query('SELECT * FROM subscriptions WHERE id=$1', [id]);
    return rows[0];
  },
  async cancel(id) {
    const { rows } = await db.query(
      `UPDATE subscriptions SET status='cancelled', end_date=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );
    return rows[0];
  },
  async findActiveByUser(user_id) {
    const { rows } = await db.query('SELECT * FROM subscriptions WHERE user_id=$1 AND status=$2', [user_id, 'active']);
    return rows;
  }
};
