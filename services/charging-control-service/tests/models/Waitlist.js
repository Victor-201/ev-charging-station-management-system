class Waitlist {
  constructor({
    waitlist_id,
    user_id,
    station_id,
    connector_type,
    position,
    estimated_wait_minutes,
    status,
    created_at
  }) {
    this.waitlist_id = waitlist_id;
    this.user_id = user_id;
    this.station_id = station_id;
    this.connector_type = connector_type;
    this.position = position;
    this.estimated_wait_minutes = estimated_wait_minutes;
    this.status = status;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new Waitlist({
      waitlist_id: row.waitlist_id,
      user_id: row.user_id,
      station_id: row.station_id,
      connector_type: row.connector_type,
      position: row.position,
      estimated_wait_minutes: row.estimated_wait_minutes,
      status: row.status,
      created_at: row.created_at
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Waitlist;
