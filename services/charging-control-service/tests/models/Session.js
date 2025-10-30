class Session {
  constructor({
    session_id,
    user_id,
    point_id,
    vehicle_id,
    reservation_id,
    start_meter_wh,
    end_meter_wh,
    status,
    started_at,
    ended_at,
    cost,
    metadata
  }) {
    this.session_id = session_id;
    this.user_id = user_id;
    this.point_id = point_id;
    this.vehicle_id = vehicle_id;
    this.reservation_id = reservation_id;
    this.start_meter_wh = start_meter_wh;
    this.end_meter_wh = end_meter_wh;
    this.status = status;
    this.started_at = started_at;
    this.ended_at = ended_at;
    this.cost = cost;
    this.metadata = metadata;
  }

  static fromRow(row) {
    return new Session({
      session_id: row.session_id,
      user_id: row.user_id,
      point_id: row.point_id,
      vehicle_id: row.vehicle_id,
      reservation_id: row.reservation_id,
      start_meter_wh: row.start_meter_wh,
      end_meter_wh: row.end_meter_wh,
      status: row.status,
      started_at: row.started_at,
      ended_at: row.ended_at,
      cost: row.cost,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Session;
