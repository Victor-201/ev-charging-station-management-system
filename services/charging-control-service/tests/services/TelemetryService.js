const Telemetry = require('../models/Telemetry');

class TelemetryService {
  constructor(telemetryRepo) {
    this.repo = telemetryRepo;
  }

  async addTelemetry(session_id, data) {
    const telemetry = new Telemetry({
      session_id,
      timestamp: new Date(),
      meter_wh: data.meter_wh,
      power_kw: data.power_kw,
      soc: data.soc
    });
    return this.repo.add(telemetry);
  }

  async getTelemetry(session_id, limit = 50) {
    return this.repo.getBySession(session_id, limit);
  }

  async clearTelemetry(session_id) {
    await this.repo.deleteBySession(session_id);
  }
}

module.exports = TelemetryService;
