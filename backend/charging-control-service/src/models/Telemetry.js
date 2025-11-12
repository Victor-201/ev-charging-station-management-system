class Telemetry {
  constructor({
    telemetry_id,
    session_id,
    timestamp,
    meter_wh,
    power_kw,
    soc
  }) {
    this.telemetry_id = telemetry_id;
    this.session_id = session_id;
    this.timestamp = timestamp ? new Date(timestamp) : new Date();
    this.meter_wh = meter_wh;
    this.power_kw = power_kw;
    this.soc = soc;
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Telemetry;
