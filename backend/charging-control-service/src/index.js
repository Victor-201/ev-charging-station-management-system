const app = require('./app.js');
const config = require('./config/env.js');
const { initRabbitConnection } = require('./core/rabbit/connection.js');
const { createConsumer } = require('./core/rabbit/consumer.js');
const PaymentDispatcher = require('./core/rabbit/dispatcher.js');

const port = config.PORT || 3004;

(async () => {
  try {
    await initRabbitConnection();

    console.log('📡 Subscribing to payment_queue...');
    await createConsumer('payment_queue', '#', async (routingKey, payload) => {
      // Delegate all payment events to dispatcher
      await PaymentDispatcher.handleEvent(routingKey, payload);
    });

    app.listen(port, () => {
      console.log(`🚀 reservation-service is running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Failed to start reservation-service:', err);
    process.exit(1);
  }
})();