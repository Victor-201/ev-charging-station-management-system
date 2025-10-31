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
    updated_at
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
    return { ...this };
  }
}

module.exports = Reservation;
