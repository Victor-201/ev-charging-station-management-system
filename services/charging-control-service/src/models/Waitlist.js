class Waitlist {
  constructor({
    waitlist_id,
    user_id,
    station_id,
    connector_type,
    position,
    estimated_wait_minutes,
    status = 'waiting',
    created_at
  }) {
    this.waitlist_id = waitlist_id;
    this.user_id = user_id;
    this.station_id = station_id;
    this.connector_type = connector_type;
    this.position = position;
    this.estimated_wait_minutes = estimated_wait_minutes;
    this.status = status;
    this.created_at = created_at ? new Date(created_at) : new Date();
  }

  isActive() {
    return this.status === 'waiting';
  }

  markServed() {
    this.status = 'served';
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Waitlist;
