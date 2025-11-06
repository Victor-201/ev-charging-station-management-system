import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import logger from '../utils/logger';

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
  private readonly deadLetterExchange: string = 'events-dlx';
  private readonly deadLetterQueue: string = 'user-service-events-dlq';
  private consumerTag: string = '';
  
  // Performance optimization
  private readonly prefetchCount: number = parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '20', 10);
  private readonly maxRetries: number = parseInt(process.env.RABBITMQ_MAX_RETRIES || '3', 10);
  
  // Metrics tracking
  private metrics = {
    processed: 0,
    failed: 0,
    retried: 0,
    lastProcessedAt: null as Date | null,
  };

  constructor(private readonly url: string) {}

  /**
   * Connect to RabbitMQ and setup consumer
   */
  async connect(): Promise<void> {
    try {
      logger.info(`Connecting to RabbitMQ at ${this.url}...`);
      
      // Create connection with heartbeat for better reliability
      this.connection = await amqp.connect(this.url, {
        heartbeat: 60,
        connectionTimeout: 10000,
      });
      
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

      this.connection.on('blocked', (reason) => {
        logger.warn('RabbitMQ connection blocked:', reason);
      });

      this.connection.on('unblocked', () => {
        logger.info('RabbitMQ connection unblocked');
      });

      // Setup channel error handlers
      this.channel.on('error', (err) => {
        logger.error('RabbitMQ channel error:', err);
      });

      this.channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
      });

      // Assert main exchange
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true,
      });

      // Assert Dead Letter Exchange (DLX) for failed messages
      await this.channel.assertExchange(this.deadLetterExchange, 'topic', {
        durable: true,
      });

      // Assert Dead Letter Queue (DLQ)
      await this.channel.assertQueue(this.deadLetterQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 604800000, // 7 days retention
        },
      });

      // Bind DLQ to DLX
      await this.channel.bindQueue(this.deadLetterQueue, this.deadLetterExchange, '#');

      // Assert main queue with DLX configuration
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 50000, // Increased to 50k messages
          'x-dead-letter-exchange': this.deadLetterExchange,
          'x-dead-letter-routing-key': 'user-service.failed',
        },
      });

      // Set prefetch to optimize throughput (default 20, configurable via env)
      await this.channel.prefetch(this.prefetchCount);

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('RabbitMQ consumer connected successfully');
      logger.info(`Queue: ${this.queueName}, Exchange: ${this.exchangeName}`);
      logger.info(`Prefetch count: ${this.prefetchCount}, Max retries: ${this.maxRetries}`);
      logger.info(`Dead Letter Queue: ${this.deadLetterQueue}`);
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

        const startTime = Date.now();
        
        try {
          const event: DomainEvent = JSON.parse(msg.content.toString());
          const retryCount = this.getRetryCount(msg);
          
          logger.info(
            `Received event: ${event.eventType} for ${event.aggregateType}:${event.aggregateId} ` +
            `(ID: ${event.eventId}, Retry: ${retryCount}/${this.maxRetries})`
          );

          // Get handler for this event type
          const handler = this.handlers.get(event.eventType);
          
          if (handler) {
            await handler(event);
            
            // Acknowledge message after successful processing
            this.channel?.ack(msg);
            
            // Update metrics
            this.metrics.processed++;
            this.metrics.lastProcessedAt = new Date();
            
            const processingTime = Date.now() - startTime;
            logger.info(
              `Successfully processed event: ${event.eventId} (${processingTime}ms)`
            );
          } else {
            logger.warn(`No handler registered for event type: ${event.eventType}`);
            // Acknowledge anyway to prevent redelivery
            this.channel?.ack(msg);
          }
        } catch (error) {
          logger.error('Error processing message:', error);
          
          const retryCount = this.getRetryCount(msg);
          
          // Update failure metrics
          this.metrics.failed++;
          
          if (retryCount >= this.maxRetries) {
            // Max retries exceeded - send to DLQ
            logger.error(
              `Message ${msg.fields.deliveryTag} failed after ${retryCount} retries, ` +
              `sending to DLQ`
            );
            this.channel?.nack(msg, false, false);
          } else {
            // Retry - increment retry count and requeue
            logger.warn(
              `Message ${msg.fields.deliveryTag} failed (attempt ${retryCount}/${this.maxRetries}), ` +
              `will retry`
            );
            
            // Update retry count in headers
            const headers = msg.properties.headers || {};
            headers['x-retry-count'] = retryCount + 1;
            headers['x-first-death-time'] = headers['x-first-death-time'] || new Date().toISOString();
            
            this.metrics.retried++;
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
   * Get retry count from message headers
   */
  private getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};
    return (headers['x-retry-count'] as number) || 0;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.processed > 0 
        ? ((this.metrics.processed / (this.metrics.processed + this.metrics.failed)) * 100).toFixed(2)
        : '0.00'
    };
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
