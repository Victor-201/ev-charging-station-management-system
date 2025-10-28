export default class Plan {
  constructor({
    id,
    name,
    description,
    type,
    price,
    duration,
    duration_days,
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
    return !!(this.duration || this.duration_days);
  }

  /** Trả về thông tin gói theo dạng JSON */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      price: this.price,
      duration: this.duration,
      duration_days: this.duration_days,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
