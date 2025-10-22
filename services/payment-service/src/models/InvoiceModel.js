import db from '../config/db.js';

export const InvoiceModel = {
  async create({ invoice_no, transaction_id, amount, issued_at = null, metadata = {} }){
    const { rows } = await db.query(
      `INSERT INTO invoices (invoice_no, transaction_id, amount, issued_at, metadata) VALUES ($1,$2,$3,COALESCE($4, NOW()), $5) RETURNING *`,
      [invoice_no, transaction_id, amount, issued_at, metadata]
    );
    return rows[0];
  },
  async findById(id) {
    const { rows } = await db.query('SELECT * FROM invoices WHERE id=$1', [id]);
    return rows[0];
  },
  async findByTransactionId(txId) {
    const { rows } = await db.query('SELECT * FROM invoices WHERE transaction_id=$1', [txId]);
    return rows[0];
  }
};
