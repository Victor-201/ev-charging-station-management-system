import amqplib from 'amqplib';

/**
 * RabbitMQ EventBus
 * Dùng cho event giữa các microservice (cross-service)
 */
class RabbitMQEventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.connection) return;

    const url = process.env.RABBITMQ_URL || 'amqp://localhost';
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();

    console.log('[RabbitMQ] Connected to broker');
  }

  /**
   * Gửi event đến exchange
   */
  async publish(event, payload) {
    if (!this.channel) await this.connect();

    const exchange = 'events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    this.channel.publish(exchange, event, Buffer.from(JSON.stringify(payload)));
    console.log(`[RabbitMQ] Published event "${event}"`);
  }

  /**
   * Lắng nghe event từ RabbitMQ
   */
  async subscribe(event, handler) {
    if (!this.channel) await this.connect();

    const exchange = 'events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    const q = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(q.queue, exchange, event);

    this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      const payload = JSON.parse(msg.content.toString());
      console.log(`[RabbitMQ] Received event "${event}"`);
      await handler(payload);
      this.channel.ack(msg);
    });
  }
}

const eventBus = new RabbitMQEventBus();

export default eventBus;
