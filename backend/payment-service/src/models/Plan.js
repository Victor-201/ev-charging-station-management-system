export default class Plan {
  constructor({
    id,
    name,
    description,
    type,              // Ví dụ: 'subscription', 'charging', 'booking'
    price,
    duration,          // Ví dụ: '1 month', '6 months', ...
    duration_days,     // Dự phòng: số ngày nếu duration không có
    created_at,
    updated_at
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = type;
    this.price = price;
    this.duration = duration;
    this.duration_days = duration_days;
    this.created_at = created_at ? new Date(created_at) : null;
    this.updated_at = updated_at ? new Date(updated_at) : null;
  }

  /** Kiểm tra gói có thời hạn hay không */
  hasDuration() {
    return Boolean(this.duration || this.duration_days);
  }

  /** Lấy tổng số ngày của gói (nếu có) */
  getDurationDays() {
    if (this.duration_days) return this.duration_days;

    // Tự động suy ra từ duration nếu có định dạng như "1 month", "6 months", "1 year"
    if (this.duration) {
      const match = this.duration.match(/(\d+)\s*(day|month|year)s?/i);
      if (!match) return null;

      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case 'day':
          return value;
        case 'month':
          return value * 30;
        case 'year':
          return value * 365;
        default:
          return null;
      }
    }

    return null;
  }

  /** Định dạng JSON khi trả về */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      price: this.price,
      duration: this.duration,
      duration_days: this.duration_days,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null
    };
  }

  /** Chuyển từ row (PostgreSQL) sang instance Plan */
  static fromRow(row) {
    if (!row) return null;
    return new Plan({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      price: row.price,
      duration: row.duration,
      duration_days: row.duration_days,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}
