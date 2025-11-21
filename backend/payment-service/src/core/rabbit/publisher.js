import { getChannel, EXCHANGE } from "./connection.js";

export function publishEvent(routingKey, payload) {
  const channel = getChannel();

  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );

  console.log(`[PAYMENT → RMQ] Sent: ${routingKey}`, payload);
}
