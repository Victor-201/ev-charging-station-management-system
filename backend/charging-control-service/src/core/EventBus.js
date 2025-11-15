const amqplib = require('amqplib');
const config = require('../config/env.js');

class EventBus {
  constructor() {
    this.exchange = 'events';
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.connection) return;
    this.connection = await amqplib.connect(config.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    console.log('[ReservationService] Connected to RabbitMQ');
  }

  async publish(event, payload) {
    if (!this.channel) await this.connect();
    this.channel.publish(this.exchange, event, Buffer.from(JSON.stringify(payload)), { persistent: true });
    console.log(`[ReservationService] 📤 Published event "${event}"`, payload);
  }

  async subscribe(event, handler) {
    if (!this.channel) await this.connect();
    const q = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(q.queue, this.exchange, event);
    console.log(`[PaymentService] Listening for "${event}"`);
    this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      const payload = JSON.parse(msg.content.toString());
      console.log(`[PaymentService] 📩 Received event "${event}"`, payload);
      await handler(payload);
      this.channel.ack(msg);
    });
  }

}

module.exports = new EventBus();
