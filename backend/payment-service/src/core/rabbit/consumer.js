import { getChannel } from "./connection.js";

export async function createConsumer(queueName, handler) {
  const channel = getChannel();

  await channel.assertQueue(queueName, { durable: true });

  channel.consume(
    queueName,
    (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      console.log(`[PAYMENT ← RMQ] Received: ${routingKey}`, content);

      handler(routingKey, content);
      channel.ack(msg);
    },
    { noAck: false }
  );

  console.log(`[PAYMENT] Listening queue: ${queueName}`);
}
