import db from '../config/db.js';
import BaseRepository from './BaseRepository.js';
import Plan from '../models/Plan.js';

export default class PlanRepository extends BaseRepository {
  constructor() {
    super(Plan, 'plans');
  }

  async create({ name, description, type, price, duration, duration_days }) {
    const query = `
      INSERT INTO ${this.tableName} (name, description, type, price, duration, duration_days)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [
      name,
      description,
      type,
      price,
      duration,
      duration_days
    ]);
    return new Plan(rows[0]);
  }

  async findAll() {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows.map(row => new Plan(row));
  }
}
