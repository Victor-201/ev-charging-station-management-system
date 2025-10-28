export default class Invoice {
  constructor({
    id,
    transaction_id,
    user_id,
    total_amount,
    due_date,
    status = 'unpaid',
    created_at,
    updated_at
  }) {
    this.id = id;
    this.transaction_id = transaction_id;
    this.user_id = user_id;
    this.total_amount = total_amount;
    this.due_date = due_date ? new Date(due_date) : null;
    this.status = status;
    this.created_at = created_at ? new Date(created_at) : null;
    this.updated_at = updated_at ? new Date(updated_at) : null;
  }

  /** Kiểm tra hóa đơn đã hết hạn chưa */
  isOverdue() {
    return this.due_date && new Date() > this.due_date && this.status !== 'paid';
  }

  /** Cập nhật trạng thái */
  markAsPaid() {
    this.status = 'paid';
  }

  /** Định dạng dữ liệu khi trả về JSON */
  toJSON() {
    return {
      id: this.id,
      transaction_id: this.transaction_id,
      user_id: this.user_id,
      total_amount: this.total_amount,
      due_date: this.due_date,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
