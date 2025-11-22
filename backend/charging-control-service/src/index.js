// src/index.js
const app = require('./app.js');
const config = require('./config/env.js');

const { initRabbitConnection } = require('./core/rabbit/connection.js');

const BookingService = require('./services/BookingService.js');
const ChargingService = require('./services/ChargingService.js');

const port = config.PORT || 3004;

(async () => {
  try {
    console.log("🔌 Initializing RabbitMQ connection...");
    await initRabbitConnection();

    console.log("🔔 Initializing service subscriptions...");

    const services = [
      { name: "BookingService", service: BookingService },
      { name: "ChargingService", service: ChargingService },
    ];

    for (const { name, service } of services) {
      if (service && typeof service.initSubscriptions === "function") {
        console.log(`📡 Starting ${name} subscriptions...`);
        await service.initSubscriptions();
      } else {
        console.warn(`⚠️ ${name}.initSubscriptions() not found`);
      }
    }

    app.listen(port, () => {
      console.log(`🚀 reservation-service is running on port ${port}`);
    });

  } catch (err) {
    console.error("❌ Failed to start reservation-service:", err);
    process.exit(1);
  }
})();
