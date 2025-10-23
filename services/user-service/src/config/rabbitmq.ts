import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { logger } from '../utils/logger';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  timestamp: Date;
  version: number;
}

type EventHandler = (event: DomainEvent) => Promise<void>;

export class RabbitMQConsumer {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectDelay: number = 5000; // 5 seconds
  private handlers: Map<string, EventHandler> = new Map();
  private readonly exchangeName: string = 'events';
  private readonly exchangeType: string = 'topic';
  private readonly queueName: string = 'user-service-events';
  private consumerTag: string = '';

  constructor(private readonly url: string) {}

  /**
   * Connect to RabbitMQ and setup consumer
   */
  async connect(): Promise<void> {
    try {
      logger.info(`Connecting to RabbitMQ at ${this.url}...`);
      
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Setup connection error handlers
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleDisconnect();
      });

      // Assert exchange
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true,
      });

      // Assert queue
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000, // Max 10k messages
        },
      });

      // Set prefetch (process one message at a time for reliability)
      await this.channel.prefetch(1);

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('RabbitMQ consumer connected successfully');
      logger.info(`Queue: ${this.queueName}, Exchange: ${this.exchangeName}`);
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
      throw error;
    }
  }

  /**
   * Subscribe to specific event types
   */
  async subscribe(routingKeys: string[]): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    for (const routingKey of routingKeys) {
      await this.channel.bindQueue(this.queueName, this.exchangeName, routingKey);
      logger.info(`Subscribed to: ${routingKey}`);
    }
  }

  /**
   * Register event handler
   */
  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
    logger.info(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Start consuming messages
   */
  async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const { consumerTag } = await this.channel.consume(
      this.queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const event: DomainEvent = JSON.parse(msg.content.toString());
          
          logger.info(`Received event: ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`);

          // Get handler for this event type
          const handler = this.handlers.get(event.eventType);
          
          if (handler) {
            await handler(event);
            
            // Acknowledge message after successful processing
            this.channel?.ack(msg);
            logger.info(`Successfully processed event: ${event.eventId}`);
          } else {
            logger.warn(`No handler registered for event type: ${event.eventType}`);
            // Acknowledge anyway to prevent redelivery
            this.channel?.ack(msg);
          }
        } catch (error) {
          logger.error('Error processing message:', error);
          
          // Check if message has been redelivered
          if (msg.fields.redelivered) {
            logger.error(`Message ${msg.fields.deliveryTag} failed after retry, sending to DLQ`);
            // Reject and don't requeue (will go to DLQ if configured)
            this.channel?.nack(msg, false, false);
          } else {
            logger.warn(`Message ${msg.fields.deliveryTag} failed, will retry`);
            // Reject and requeue for retry
            this.channel?.nack(msg, false, true);
          }
        }
      },
      {
        noAck: false, // Manual acknowledgment for reliability
      }
    );

    this.consumerTag = consumerTag;
    logger.info(`Started consuming messages with tag: ${consumerTag}`);
  }

  /**
   * Stop consuming messages
   */
  async stopConsuming(): Promise<void> {
    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
      logger.info('Stopped consuming messages');
    }
  }

  /**
   * Handle disconnection and attempt reconnection
   */
  private handleDisconnect(): void {
    this.isConnected = false;
    this.channel = null;
    this.connection = null;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        30000 // Max 30 seconds
      );

      logger.info(
        `Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect()
          .then(() => {
            // Re-subscribe and start consuming
            return this.startConsuming();
          })
          .catch((error) => {
            logger.error('Reconnection failed:', error);
          });
      }, delay);
    } else {
      logger.error(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Please restart the service.`
      );
    }
  }

  /**
   * Close connection gracefully
   */
  async close(): Promise<void> {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      await this.stopConsuming();

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      this.isConnected = false;
      logger.info('RabbitMQ consumer closed successfully');
    } catch (error) {
      logger.error('Error closing RabbitMQ consumer:', error);
      throw error;
    }
  }

  /**
   * Check if consumer is connected
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
export const rabbitmqConsumer = new RabbitMQConsumer(RABBITMQ_URL);
