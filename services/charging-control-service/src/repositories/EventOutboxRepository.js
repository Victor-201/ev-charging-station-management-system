const EventOutbox = require('../models/EventOutbox');

class EventOutboxRepository {
  constructor(pool) {
    this.pool = pool; // MySQL pool
    this.table = 'event_outbox';
  }

  async create(event) {
    if (!(event instanceof EventOutbox)) {
      throw new Error('event must be an instance of EventOutbox');
    }

    const sql = `INSERT INTO ${this.table} 
      (id, aggregate_type, aggregate_id, type, payload, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const data = event.toJSON();
    await this.pool.query(sql, [
      data.id,
      data.aggregate_type,
      data.aggregate_id,
      data.type,
      JSON.stringify(data.payload),
      data.status,
      data.created_at,
      data.updated_at
    ]);

    return event;
  }

  async findPending(limit = 10) {
    const sql = `SELECT * FROM ${this.table} WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`;
    const [rows] = await this.pool.query(sql, [limit]);
    return rows.map(row => new EventOutbox({
      ...row,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
    }));
  }

  async markProcessed(eventId) {
    const sql = `UPDATE ${this.table} SET status = 'processed', updated_at = ? WHERE id = ?`;
    await this.pool.query(sql, [new Date(), eventId]);
  }
}

module.exports = EventOutboxRepository;
