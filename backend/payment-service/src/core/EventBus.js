import amqplib from 'amqplib';
import config from '../config/env.js';

class RabbitMQEventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.reconnectDelay = 5000; // 5s
    this.exchange = 'events';
  }

  async connect() {
    if (this.connection) return;
    try {
      this.connection = await amqplib.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createConfirmChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      this.connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error', err.message);
        this.connection = null;
        this.channel = null;
        setTimeout(() => this.connect(), this.reconnectDelay);
      });

      this.connection.on('close', () => {
        console.warn('[RabbitMQ] Connection closed, reconnecting...');
        this.connection = null;
        this.channel = null;
        setTimeout(() => this.connect(), this.reconnectDelay);
      });

      console.log('[RabbitMQ] Connected to broker');
    } catch (err) {
      console.error('[RabbitMQ] Connection failed, retrying...', err.message);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  async publish(event, payload) {
    if (!this.channel) await this.connect();
    return new Promise((resolve, reject) => {
      this.channel.publish(
        this.exchange,
        event,
        Buffer.from(JSON.stringify(payload)),
        {},
        (err, ok) => {
          if (err) {
            console.error(`[RabbitMQ] Publish failed "${event}"`, err.message);
            return reject(err);
          }
          console.log(`[RabbitMQ] Published event "${event}"`);
          resolve(ok);
        }
      );
    });
  }

  async subscribe(event, handler) {
    if (!this.channel) await this.connect();

    // exclusive queue => temporary consumer
    const q = await this.channel.assertQueue('', { exclusive: true, durable: false });
    await this.channel.bindQueue(q.queue, this.exchange, event);

    this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ] Received event "${event}"`);
        await handler(payload);
        this.channel.ack(msg);
      } catch (err) {
        console.error('[RabbitMQ] Handler error', err.message);
        this.channel.nack(msg, false, true); // requeue
      }
    });
  }
}

const eventBus = new RabbitMQEventBus();
export default eventBus;
