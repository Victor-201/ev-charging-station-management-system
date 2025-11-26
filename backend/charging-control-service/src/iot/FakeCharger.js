const EventEmitter = require("events");
const dayjs = require("dayjs");

class FakeCharger extends EventEmitter {
  constructor(point_id) {
    super();
    this.point_id = point_id;
    this.meter_wh = 0;
    this.meterWhFloat = 0; // giữ số lẻ để tránh tròn sớm
    this.power_kw = 1 + Math.random() * 4; // chỉ hiển thị, không ảnh hưởng Wh
    this.timer = null;
    this.paused = false;
    this.MAX_WH = 60000; // 60 kWh
  }

  start() {
    if (this.timer) return;
    this.paused = false;

    const tick = () => {
      // fluctuation power nhẹ (chỉ hiển thị)
      this.power_kw += (Math.random() - 0.5) * 0.4; // +/- ~0.2 kW
      if (this.power_kw < 0.2) this.power_kw = 0.2;
      if (this.power_kw > 22) this.power_kw = 22;

      // ============================
      // FIXED ENERGY LOGIC
      // 1 phút => 1000 Wh
      // tick mỗi giây => deltaWh = 1000 / 60 ≈ 16.666 Wh
      // ============================
      const deltaWh = 1000 / 60; 
      this.meterWhFloat += deltaWh;

      const newMeterWh = Math.min(Math.floor(this.meterWhFloat), this.MAX_WH);
      if (newMeterWh !== this.meter_wh) this.meter_wh = newMeterWh;

      const soc = Math.min(100, Math.floor((this.meter_wh / this.MAX_WH) * 100));

      this.emit("telemetry", {
        point_id: this.point_id,
        meter_wh: this.meter_wh,
        power_kw: Number(this.power_kw.toFixed(3)),
        soc,
        timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss.SSS"),
      });

      if (this.meter_wh >= this.MAX_WH) {
        this.stop();
      }
    };

    tick(); // emit ngay
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