import amqplib from 'amqplib';
import config from '../config/env.js';

export const RMQ_EXCHANGE = 'events';
export const RMQ_QUEUE = 'payment_queue';
export const RMQ_ROUTING_KEYS = [
  'payment.topup.succeeded',
  'payment.topup.failed',
  'payment.booking.succeeded',
  'payment.booking.failed',
  'payment.charging.succeeded',
  'payment.charging.failed',
  'payment.refund',
  'payment.refund.success',
  'payment.refund.retry',
];

class EventBus {
  constructor() {
    this.exchange = RMQ_EXCHANGE;
    this.queueName = RMQ_QUEUE;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.connection) return;

    this.connection = await amqplib.connect(config.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    await this.channel.assertQueue(this.queueName, { durable: true });

    // Bind queue với tất cả routing key
    for (const key of RMQ_ROUTING_KEYS) {
      await this.channel.bindQueue(this.queueName, this.exchange, key);
    }

    console.log('[EventBus] Connected to RabbitMQ and bound routing keys');
  }

  async publish(event, payload) {
    if (!this.channel) await this.connect();
    this.channel.publish(
      this.exchange,
      event,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
    console.log(`[EventBus] Published "${event}"`, payload);
  }

  async subscribe(event, handler) {
    if (!this.channel) await this.connect();

    console.log(`[EventBus] Subscribing to "${event}" on queue "${this.queueName}"`);
    this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;

      const payload = JSON.parse(msg.content.toString());
      if (msg.fields.routingKey !== event) return this.channel.nack(msg, false, true);

      try {
        await handler(payload);
        this.channel.ack(msg);
      } catch (err) {
        console.error('[EventBus] Handler error:', err);
        this.channel.nack(msg, false, false);
      }
    });
  }
}

const eventBus = new EventBus();
export default eventBus;
