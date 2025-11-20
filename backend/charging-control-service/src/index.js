// src/index.js
const app = require('./app.js');
const config = require('./config/env.js');
const { initRabbitConnection } = require('./core/rabbit/connection.js');
const BookingService = require('./services/BookingService.js');

const port = config.PORT || 3004;

(async () => {
  try {
    console.log("🔌 Initializing RabbitMQ connection...");
    await initRabbitConnection();

    // Sau khi RabbitMQ sẵn sàng thì khởi tạo subscription của BookingService
    if (typeof BookingService.initSubscriptions === 'function') {
      await BookingService.initSubscriptions();
    } else {
      console.warn("[Startup] BookingService.initSubscriptions() not found.");
    }

    app.listen(port, () => {
      console.log(`📦 reservation-service is running on port ${port}`);
    });

  } catch (err) {
    console.error("❌ Failed to start reservation-service:", err);
    process.exit(1);
  }
})();
