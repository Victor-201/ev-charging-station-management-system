export default class Invoice {
  constructor({
    id,
    transaction_id,
    user_id,
    total_amount,
    due_date,
    status = 'unpaid',
    created_at,
    updated_at,
  }) {
    if (!user_id) throw new Error('user_id is required');
    if (total_amount == null || total_amount <= 0)
      throw new Error('total_amount must be greater than zero');
    if (
      status &&
      !['unpaid', 'paid', 'overdue', 'cancelled'].includes(status)
    )
      throw new Error(`Invalid invoice status: ${status}`);

    this.id = id;
    this.transaction_id = transaction_id || null;
    this.user_id = user_id;
    this.total_amount = parseFloat(total_amount);
    this.due_date = due_date ? new Date(due_date) : null;
    this.status = status;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  /** === Kiểm tra hóa đơn đã hết hạn chưa === */
  isOverdue() {
    const now = new Date();
    return (
      this.due_date &&
      now > this.due_date &&
      !['paid', 'cancelled'].includes(this.status)
    );
  }

  /** === Đánh dấu là đã thanh toán === */
  markAsPaid() {
    if (this.status !== 'paid') {
      this.status = 'paid';
      this.updated_at = new Date();
    }
  }

  /** === Đánh dấu là quá hạn === */
  markAsOverdue() {
    if (this.isOverdue()) {
      this.status = 'overdue';
      this.updated_at = new Date();
    }
  }

  /** === Hủy hóa đơn (nếu chưa thanh toán) === */
  cancel() {
    if (this.status !== 'paid') {
      this.status = 'cancelled';
      this.updated_at = new Date();
    }
  }

  /** === Dữ liệu định dạng để lưu/hiển thị === */
  toJSON() {
    return {
      id: this.id,
      transaction_id: this.transaction_id,
      user_id: this.user_id,
      total_amount: this.total_amount,
      due_date: this.due_date ? this.due_date.toISOString() : null,
      status: this.status,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null,
    };
  }
  
  /** === Helper: kiểm tra có thể thanh toán không === */
  canBePaid() {
    return ['unpaid', 'overdue'].includes(this.status);
  }

  /** === Khởi tạo từ row trong database === */
   static fromRow(row) {
    if (!row) return null;
    return new Invoice(row);
  }
}
