class Session {
  constructor({
    session_id,
    user_id,
    charging_point_id,
    vehicle_id,
    reservation_id = null,
    start_meter_wh = 0,
    end_meter_wh = 0,
    status = 'initiated',
    started_at,
    ended_at,
    kwh = 0,
    cost = 0,
    metadata = {},
    created_at,
    updated_at
  }) {
    this.session_id = session_id;
    this.user_id = user_id;
    this.charging_point_id = charging_point_id;
    this.vehicle_id = vehicle_id;
    this.reservation_id = reservation_id;
    this.start_meter_wh = start_meter_wh;
    this.end_meter_wh = end_meter_wh;
    this.status = status;
    this.started_at = started_at ? new Date(started_at) : null;
    this.ended_at = ended_at ? new Date(ended_at) : null;
    this.kwh = kwh;
    this.cost = cost;
    this.metadata = metadata;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  isActive() {
    return ['initiated', 'charging'].includes(this.status);
  }

  startCharging() {
    this.status = 'charging';
    this.started_at = new Date();
  }

  markAsCompleted() {
    this.status = 'completed';
    this.ended_at = new Date();
  }

  fail() {
    this.status = 'failed';
  }

  cancel() {
    this.status = 'cancelled';
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Session;
