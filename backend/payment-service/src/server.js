import app from './app.js';
import config from './config/env.js';
import { initRabbitConnection } from './core/rabbit/connection.js';

const port = config.PORT;

(async () => {
  try {
    console.log("Initializing RabbitMQ connection for Payment Service...");
    await initRabbitConnection();

    app.listen(port, () => {
      console.log(`payment-service listening on port ${port}`);
    });

  } catch (err) {
    console.error("Failed to start payment-service:", err.message);
    process.exit(1);
  }
})();
