// core/rabbit/connection.js
const amqp = require("amqplib");
const config = require("../../config/env.js");

let connection = null;
let channel = null;

const RMQ_EXCHANGE = config.EXCHANGE_NAME || "payments";

async function initRabbitConnection() {
  if (connection) return { connection, channel };

  connection = await amqp.connect(config.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Topic exchange cho microservice
  await channel.assertExchange(RMQ_EXCHANGE, "direct", { durable: true });

  console.log(`[RABBIT] Connected to exchange: ${RMQ_EXCHANGE}`);

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
