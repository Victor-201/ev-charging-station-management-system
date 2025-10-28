import db from '../config/db.js';

export default class BaseRepository {
  constructor(model, tableName) {
    this.model = model;
    this.tableName = tableName;
  }

  async findById(id) {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName} WHERE id=$1`, [id]);
    return rows[0] ? new this.model(rows[0]) : null;
  }

  async findAll() {
    const { rows } = await db.query(`SELECT * FROM ${this.tableName}`);
    return rows.map(r => new this.model(r));
  }

  async deleteById(id) {
    await db.query(`DELETE FROM ${this.tableName} WHERE id=$1`, [id]);
  }
}
