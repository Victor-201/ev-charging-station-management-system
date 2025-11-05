export default class Subscription {
  constructor({
    id,
    user_id,
    plan_id,
    start_date,
    end_date,
    status = 'active',
    created_at,
    updated_at
  }) {
    this.id = id;
    this.user_id = user_id;
    this.plan_id = plan_id;
    this.start_date = start_date ? new Date(start_date) : null;
    this.end_date = end_date ? new Date(end_date) : null;
    this.status = status;
    this.created_at = created_at ? new Date(created_at) : null;
    this.updated_at = updated_at ? new Date(updated_at) : null;
  }

  /** Kiểm tra subscription còn hiệu lực không */
  isActive() {
    return this.status === 'active' && (!this.end_date || new Date() < this.end_date);
  }

  /** Kiểm tra subscription đã hết hạn */
  isExpired() {
    return this.end_date && new Date() > this.end_date && this.status !== 'cancelled';
  }

  /** Đánh dấu subscription bị hủy */
  cancel() {
    this.status = 'cancelled';
    this.end_date = new Date();
  }

  /** Đánh dấu subscription hết hạn */
  expire() {
    this.status = 'expired';
    this.end_date = new Date();
  }

  /** Định dạng JSON trả về (ISO date) */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      plan_id: this.plan_id,
      start_date: this.start_date ? this.start_date.toISOString() : null,
      end_date: this.end_date ? this.end_date.toISOString() : null,
      status: this.status,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null
    };
  }

  /** Tạo instance từ row trong database */
  static fromRow(row) {
    if (!row) return null;
    return new Subscription({
      id: row.id,
      user_id: row.user_id,
      plan_id: row.plan_id,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}
