const amqp = require("amqplib");
const config = require("../../config/env.js");

let connection = null;
let channel = null;

const RMQ_EXCHANGE = config.EXCHANGE_NAME;

async function initRabbitConnection() {
  if (connection) return { connection, channel };

  const RABBIT_URL = config.RABBITMQ_URL;

  connection = await amqp.connect(RABBIT_URL);
  channel = await connection.createChannel();

  await channel.assertExchange(RMQ_EXCHANGE, "direct", { durable: true });

  console.log("[RABBIT] Charging connected");

  return { connection, channel };
}

function getChannel() {
  if (!channel) throw new Error("[RABBIT] Channel not initialized");
  return channel;
}

module.exports = {
  initRabbitConnection,
  getChannel,
  EXCHANGE: RMQ_EXCHANGE,
};
