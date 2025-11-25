const FakeCharger = require("./FakeCharger");

/**
 * IoTManager: quản lý nhiều FakeCharger
 * - Start / Stop / Pause / Resume
 * - Emit telemetry qua Socket.IO
 */
class IoTManager {
  constructor(io) {
    this.io = io;
    this.devices = {};
  }

  /** Start hoặc resume thiết bị */
  startDevice(session_id) {
    if (this.devices[session_id]) {
      this.devices[session_id].start();
      return;
    }

    const device = new FakeCharger({ session_id });
    this.devices[session_id] = device;

    device.on("telemetry", (data) => {
      this.io.to(session_id).emit("telemetry_update", data);
    });

    device.on("charging_completed", (data) => {
      this.io.to(session_id).emit("charging_completed", data);
    });

    device.start();
  }

  /** Pause thiết bị */
  pauseDevice(session_id) {
    if (this.devices[session_id]) {
      this.devices[session_id].pause();
    }
  }

  /** Stop thiết bị */
  stopDevice(session_id) {
    if (this.devices[session_id]) {
      this.devices[session_id].stop();
      delete this.devices[session_id];
    }
  }

  /** Stop tất cả thiết bị */
  stopAll() {
    Object.keys(this.devices).forEach((session_id) => this.stopDevice(session_id));
  }
}

module.exports = IoTManager;
