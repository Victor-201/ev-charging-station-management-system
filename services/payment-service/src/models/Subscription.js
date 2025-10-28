export default class Subscription {
  constructor({
    id,
    user_id,
    plan_id,
    start_date,
    end_date,
    status,
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

  /** Đánh dấu subscription bị hủy */
  cancel() {
    this.status = 'cancelled';
    this.end_date = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      plan_id: this.plan_id,
      start_date: this.start_date,
      end_date: this.end_date,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
