// iot/FakeCharger.js
const EventEmitter = require("events");
const dayjs = require("dayjs");

class FakeCharger extends EventEmitter {
  constructor(point_id) {
    super();
    this.point_id = point_id;
    this.meter_wh = 0;
    this.meterWhFloat = 0; // <-- keep fractional Wh to avoid floor truncation losing progress
    this.power_kw = 1 + Math.random() * 4;
    this.timer = null;
    this.paused = false;
  }

  start() {
    // Only prevent double-start when timer already running.
    if (this.timer) return;

    this.paused = false;

    const tick = () => {
      // small fluctuation to power so telemetry is not completely static
      this.power_kw += (Math.random() - 0.5) * 0.4; // +/- ~0.2 kW
      if (this.power_kw < 0.2) this.power_kw = 0.2;
      if (this.power_kw > 22) this.power_kw = 22;

      // accurate Wh-per-second accumulation to avoid meter_wh staying at 0
      const deltaWh = (this.power_kw * 1000) / 3600; // kW -> Wh/sec
      this.meterWhFloat += deltaWh;
      const newMeterWh = Math.floor(this.meterWhFloat);
      if (newMeterWh !== this.meter_wh) this.meter_wh = newMeterWh;

      const soc = Math.min(100, Math.floor((this.meter_wh / 50000) * 100));

      this.emit("telemetry", {
        point_id: this.point_id,
        meter_wh: this.meter_wh,
        power_kw: Number(this.power_kw.toFixed(3)),
        soc,
        timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss.SSS"),
      });
    };

    // emit once immediately so FE/DB get an initial reading without waiting 1s
    tick();
    this.timer = setInterval(tick, 1000);

    console.log("[FakeCharger] started:", this.point_id);
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.paused = true;
      console.log("[FakeCharger] paused:", this.point_id);
    }
  }

  resume() {
    // allow resume to actually restart the interval
    if (!this.timer && this.paused) {
      this.paused = false;
      this.start();
      console.log("[FakeCharger] resumed:", this.point_id);
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.paused = false;
    console.log("[FakeCharger] stopped:", this.point_id);
  }
}

module.exports = FakeCharger;
