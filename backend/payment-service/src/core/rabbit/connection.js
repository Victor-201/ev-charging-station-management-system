import amqp from 'amqplib';
import config from '../../config/env.js';

let connection = null;
let channel = null;

const RMQ_EXCHANGE = config.EXCHANGE_NAME;

export async function initRabbitConnection() {
  if (connection) return { connection, channel };

  const RABBIT_URL = config.RABBITMQ_URL;

  connection = await amqp.connect(RABBIT_URL);
  channel = await connection.createChannel();

  // tạo exchange
  await channel.assertExchange(RMQ_EXCHANGE, 'direct', { durable: true });

  console.log('[RABBIT] Connected & Exchange Ready');

  return { connection, channel };
}

export function getChannel() {
  if (!channel) throw new Error("[RABBIT] Channel not initialized");
  return channel;
}

export const EXCHANGE = RMQ_EXCHANGE;
