// core/rabbit/publisher.js
const { getChannel, EXCHANGE } = require("./connection.js");

function publishEvent(routingKey, payload) {
  const channel = getChannel();

  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );

  console.log(`[RMQ →] Sent: ${routingKey}`, payload);
}

module.exports = { publishEvent };
