// iot/IoTManager.js
const FakeCharger = require("./FakeCharger");

class IoTManager {
  constructor(io, chargingService) {
    this.io = io;
    this.chargingService = chargingService;
    this.devices = {}; // keyed by session_id -> { device, point_id }
  }

  /** Start a fake charger for a session */
  async startDevice(session_id, token) {
    if (!session_id) {
      console.warn('[IoT] startDevice called without session_id');
      return;
    }
    if (this.devices[session_id]) {
      console.log("[IoT] Device already running for session:", session_id);
      return;
    }

    // load session to know point_id
    const session = await this.chargingService.getSession(session_id);
    if (!session) {
      console.warn("[IoT] Session not found:", session_id);
      return;
    }
    const point_id = session.point_id || session.point || String(session.connector_id || session.pointId || '');

    const device = new FakeCharger(point_id);

    // Khi FakeCharger emit telemetry → đẩy vào ChargingService
    device.on("telemetry", async (t) => {
      try {
        await this.chargingService.pushMeterReading({
          session_id,
          meter_wh: t.meter_wh,
          power_kw: t.power_kw,
          soc: t.soc,
          timestamp: t.timestamp,
          token
        });

        // Đồng thời gửi realtime về FE (theo session và theo point)
        try {
          if (this.io) {
            this.io.to(session_id).emit("telemetry", { session_id, ...t });
            if (point_id) this.io.to(point_id).emit("telemetry", { session_id, ...t });
          }
        } catch (ioErr) {
          console.error("[IoT] Socket emit error:", ioErr);
        }
      } catch (err) {
        console.error("[IoT] Telemetry error:", err);
      }
    });

    device.start();
    this.devices[session_id] = { device, point_id };
    console.log("[IoT] Device started for session:", session_id, "point:", point_id);
  }

  /** Pause a running fake charger (by session) */
  pauseDevice(session_id) {
    const rec = this.devices[session_id];
    if (!rec) {
      console.warn('[IoT] pauseDevice: not found for session', session_id);
      return;
    }
    rec.device.pause();
    console.log("[IoT] Device paused for session:", session_id);
  }

  /** Resume a paused charger (by session) */
  resumeDevice(session_id) {
    const rec = this.devices[session_id];
    if (!rec) {
      console.warn('[IoT] resumeDevice: not found for session', session_id);
      return;
    }
    rec.device.resume();
    console.log("[IoT] Device resumed for session:", session_id);
  }

  /** Stop a charger (by session) */
  stopDevice(session_id) {
    const rec = this.devices[session_id];
    if (!rec) return;

    rec.device.stop();
    delete this.devices[session_id];
    console.log("[IoT] Device stopped for session:", session_id);
  }
}

module.exports = IoTManager;
