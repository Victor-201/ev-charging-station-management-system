class Telemetry {
  constructor({
    telemetry_id,
    session_id,
    timestamp,
    meter_wh,
    power_kw,
    price_per_kw,
    soc
  }) {
    this.telemetry_id = telemetry_id;
    this.session_id = session_id;

    // Convert timestamp về dạng Date chuẩn
    // MySQL DATETIME(3) → new Date("2025-01-01T10:00:00.123Z")
    this.timestamp = timestamp ? new Date(timestamp) : new Date();

    this.meter_wh = meter_wh;
    this.power_kw = power_kw;
    this.price_per_kw = price_per_kw;
    this.soc = soc;
  }

  toJSON() {
    return {
      telemetry_id: this.telemetry_id,
      session_id: this.session_id,
      timestamp: this.timestamp,
      meter_wh: this.meter_wh,
      power_kw: this.power_kw,
      price_per_kw: this.price_per_kw,
      soc: this.soc
    };
  }
}

module.exports = Telemetry;
