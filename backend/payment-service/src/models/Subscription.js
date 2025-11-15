export default class Subscription {
  constructor({
    id,
    user_id,
    plan_id,
    start_date,
    end_date,
    status = 'pending',
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

  active() {
    this.status = 'active';
  }

  expire() {
    this.status = 'expired';
    this.end_date = new Date();
  }

  cancel() {
    this.status = 'cancelled';
    this.end_date = new Date();
  }

  isActive() {
    return this.status === 'active' && (!this.end_date || new Date() < this.end_date);
  }

  isExpired() {
    return this.end_date && new Date() > this.end_date && this.status !== 'cancelled';
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      plan_id: this.plan_id,
      start_date: this.start_date?.toISOString() || null,
      end_date: this.end_date?.toISOString() || null,
      status: this.status,
      created_at: this.created_at?.toISOString() || null,
      updated_at: this.updated_at?.toISOString() || null
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new Subscription(row);
  }
}
