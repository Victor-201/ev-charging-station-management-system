const { getChannel } = require("./connection.js");

async function createConsumer(queueName, handler) {
  const channel = getChannel();

  await channel.assertQueue(queueName, { durable: true });

  channel.consume(
    queueName,
    (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      console.log(`[CHARGING ← RMQ] Received: ${routingKey}`, content);

      handler(routingKey, content);
      channel.ack(msg);
    },
    { noAck: false }
  );

  console.log(`[CHARGING] Listening queue: ${queueName}`);
}

module.exports = {
  createConsumer,
};
