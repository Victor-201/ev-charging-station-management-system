// core/rabbit/consumer.js
const { getChannel, EXCHANGE } = require("./connection.js");

async function createConsumer(queueName, routingPattern, handler) {
  const channel = getChannel();

  // Tạo queue
  await channel.assertQueue(queueName, { durable: true });

  // Bind queue vào exchange theo routing key pattern
  await channel.bindQueue(queueName, EXCHANGE, routingPattern);

  console.log(`[RMQ] Queue '${queueName}' bound → ${EXCHANGE}(${routingPattern})`);

  channel.prefetch(1);

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const content = JSON.parse(msg.content.toString());

      console.log(`[RMQ ← ${queueName}] Received: ${routingKey}`, content);

      try {
        await handler(routingKey, content);
        channel.ack(msg);
      } catch (err) {
        console.error(`[RMQ] Handler error:`, err);
        channel.nack(msg, false, false); // không requeue
      }
    },
    { noAck: false }
  );

  console.log(`[RMQ] Listening queue: ${queueName}`);
}

module.exports = {
  createConsumer,
};
