class Reservation {
  constructor({
    reservation_id,
    user_id,
    station_id,
    point_id,
    connector_type,
    start_time,
    end_time,
    status,
    expires_at,
    created_at
  }) {
    this.reservation_id = reservation_id;
    this.user_id = user_id;
    this.station_id = station_id;
    this.point_id = point_id;
    this.connector_type = connector_type;
    this.start_time = start_time;
    this.end_time = end_time;
    this.status = status;
    this.expires_at = expires_at;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new Reservation({
      reservation_id: row.reservation_id,
      user_id: row.user_id,
      station_id: row.station_id,
      point_id: row.point_id,
      connector_type: row.connector_type,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Reservation;
