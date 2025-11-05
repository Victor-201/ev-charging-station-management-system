class Reservation {
  constructor({
    reservation_id,
    user_id,
    station_id,
    point_id,
    connector_type = 'Type2',
    start_time,
    end_time,
    status = 'pending',
    expires_at,
    created_at,
    updated_at,
    price_per_min = 1000,     // 🆕 Giá mỗi phút
    reserved_minutes = null,  // 🆕 Số phút đã tính
    total_cost = 0            // 🆕 Tổng tiền
    
  }) {
    this.reservation_id = reservation_id;
    this.user_id = user_id;
    this.station_id = station_id;
    this.point_id = point_id;
    this.connector_type = connector_type;
    this.start_time = start_time ? new Date(start_time) : null;
    this.end_time = end_time ? new Date(end_time) : null;
    this.status = status;
    this.expires_at = expires_at ? new Date(expires_at) : null;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
    this.price_per_min = price_per_min;
    this.reserved_minutes = reserved_minutes;
    this.total_cost = total_cost;
  }

  isExpired() {
    return this.expires_at && new Date() > this.expires_at && this.status === 'pending';
  }

  confirm() {
    this.status = 'confirmed';
  }

  cancel() {
    this.status = 'cancelled';
  }

  complete() {
    this.status = 'completed';
  }

  toJSON() {
    return {
      reservation_id: this.reservation_id,
      user_id: this.user_id,
      station_id: this.station_id,
      point_id: this.point_id,
      connector_type: this.connector_type,
      start_time: this.start_time,
      end_time: this.end_time,
      status: this.status,
      expires_at: this.expires_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
      price_per_min: this.price_per_min,
      reserved_minutes: this.reserved_minutes,
      total_cost: this.total_cost
    };
  }
}

module.exports = Reservation;
