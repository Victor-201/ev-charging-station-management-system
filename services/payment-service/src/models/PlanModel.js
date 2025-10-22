import db from '../config/db.js';

export const PlanModel = {
  async findAll() {
    const { rows } = await db.query('SELECT * FROM plans ORDER BY created_at DESC');
    return rows;
  },
  async findById(id) {
    const { rows } = await db.query('SELECT * FROM plans WHERE id=$1', [id]);
    return rows[0];
  },
  async create({ name, description, type, price, duration }) {
    const { rows } = await db.query(
      `INSERT INTO plans (name, description, type, price, duration) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, description, type, price, duration]
    );
    return rows[0];
  }
};
