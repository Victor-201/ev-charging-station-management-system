import db from '../config/db.js';

export const TransactionModel = {
  async create({ external_id = null, user_id, session_id = null, amount, currency = 'VND', method = null, status = 'pending', meta = {} }) {
    const { rows } = await db.query(
      `INSERT INTO transactions 
        (external_id, user_id, session_id, amount, currency, method, status, meta) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [external_id, user_id, session_id, amount, currency, method, status, meta]
    );
    return rows[0];
  },

  async updateStatus(id, status, updatedMeta = {}) {
    const { rows } = await db.query(
      `UPDATE transactions 
       SET status=$2, meta = COALESCE(meta, '{}'::jsonb) || $3, updated_at=NOW() 
       WHERE id=$1 RETURNING *`,
      [id, status, updatedMeta]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM transactions WHERE id=$1', [id]);
    return rows[0];
  },

  async findByExternalId(external_id) {
    const { rows } = await db.query('SELECT * FROM transactions WHERE external_id=$1', [external_id]);
    return rows[0];
  },

  async findByReferenceCode(referenceCode) {
    const { rows } = await db.query("SELECT * FROM transactions WHERE meta->>'referenceCode' = $1", [referenceCode]);
    return rows[0];
  }
};
