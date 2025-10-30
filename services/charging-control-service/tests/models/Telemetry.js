class Telemetry {
  constructor({
    telemetry_id,
    session_id,
    timestamp,
    meter_wh,
    power_kw,
    voltage_v,
    current_a,
    soc
  }) {
    this.telemetry_id = telemetry_id;
    this.session_id = session_id;
    this.timestamp = timestamp;
    this.meter_wh = meter_wh;
    this.power_kw = power_kw;
    this.voltage_v = voltage_v;
    this.current_a = current_a;
    this.soc = soc; // state of charge %
  }

  static fromRow(row) {
    return new Telemetry({
      telemetry_id: row.telemetry_id,
      session_id: row.session_id,
      timestamp: row.timestamp,
      meter_wh: row.meter_wh,
      power_kw: row.power_kw,
      voltage_v: row.voltage_v,
      current_a: row.current_a,
      soc: row.soc
    });
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Telemetry;
