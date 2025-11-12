const amqp = require('amqplib');

let connection;
let channel;

async function connectRabbit() {
  const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
  try {
    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    console.log('✅ Connected to RabbitMQ');
  } catch (err) {
    console.error('❌ RabbitMQ connection failed:', err.message);
  }
}

function getChannel() {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
}

async function publish(queue, message) {
  if (!channel) {
    console.warn('⚠️  RabbitMQ channel not available, skipping publish.');
    return;
  }
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

async function closeRabbit() {
  try {
    await channel.close();
    await connection.close();
    console.log('🔌 RabbitMQ connection closed');
  } catch (e) {
    console.error('Error closing RabbitMQ:', e);
  }
}

module.exports = { connectRabbit, publish, closeRabbit, getChannel };
