const EventEmitter = require("events");
const TelemetryService = require("../services/TelemetryService");
const SessionRepo = require("../repositories/SessionRepository");
const dayjs = require("dayjs");

/**
 * FakeCharger: Mô phỏng trạm sạc EV
 * - SOC tăng mỗi tick
 * - Lưu telemetry vào DB
 * - Emit event telemetry + charging_completed
 * - Hỗ trợ start, stop, pause, resume
 */
class FakeCharger extends EventEmitter {
  constructor({ session_id, power_kw = 7.4 }) {
    super();
    this.session_id = session_id;
    this.power_kw = power_kw;

    this.state = {
      soc: 20,
      meter_wh: 0,
      price_per_kw: 3500,
      running: false,
      paused: false
    };

    this.interval = null;
  }

  /** Start / Resume sạc */
  start() {
    if (this.state.running) {
      this.state.paused = false;
      return;
    }

    this.state.running = true;
    this.state.paused = false;

    console.log(`[FakeIoT] Session ${this.session_id} started`);

    this.interval = setInterval(() => this.tick(), 1000);
  }

  /** Pause sạc */
  pause() {
    if (this.state.running) this.state.paused = true;
  }

  /** Stop sạc */
  stop() {
    if (this.interval) clearInterval(this.interval);
    this.state.running = false;
    this.state.paused = false;
  }

  /** Tick mỗi giây */
  async tick() {
    if (this.state.paused) return;

    const session = await SessionRepo.getById(this.session_id);
    if (!session || ["completed", "stopped"].includes((session.status || "").toLowerCase())) {
      this.stop();
      return;
    }

    // Tăng SOC + meter
    this.state.soc = Math.min(this.state.soc + 1, 100);
    this.state.meter_wh += (this.power_kw * 1000) / 3600;

    // Tính chi phí
    const cost = (this.state.meter_wh / 1000) * this.state.price_per_kw;

    // Push telemetry vào DB
    await TelemetryService.pushMeterReading({
      session_id: this.session_id,
      meter_wh: Math.round(this.state.meter_wh),
      power_kw: this.power_kw,
      soc: this.state.soc
    });

    // Emit telemetry
    this.emit("telemetry", {
      session_id: this.session_id,
      soc: this.state.soc,
      meter_wh: this.state.meter_wh,
      power_kw: this.power_kw,
      cost: Math.round(cost),
      eta_seconds: (100 - this.state.soc) * (3600 / this.power_kw) * 0.01,
      timestamp: dayjs().toISOString()
    });

    // Sạc đầy
    if (this.state.soc >= 100) {
      this.emit("charging_completed", {
        session_id: this.session_id,
        message: "Battery fully charged!"
      });
      this.stop();
    }
  }
}

module.exports = FakeCharger;
