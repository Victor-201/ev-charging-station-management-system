import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/logger';

interface DomainEvent {
  event_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: any;
  metadata: {
    service: string;
    version: string;
    timestamp: string;
    correlation_id?: string;
  };
}

class RabbitMQClient {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly url: string;
  private readonly exchange = 'events';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to RabbitMQ...', { url: this.url });
      
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Setup exchange
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true
      });

      // Setup dead letter exchange
      await this.channel.assertExchange('events.dlx', 'topic', {
        durable: true
      });

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;

      // Handle connection errors
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleDisconnect();
      });

      logger.info('✅ Connected to RabbitMQ successfully');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      logger.info(`Reconnecting to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached. Please restart the service.');
    }
  }

  async publish(routingKey: string, payload: any, aggregateId?: string): Promise<boolean> {
    if (!this.channel) {
      logger.error('RabbitMQ channel not initialized');
      return false;
    }

    try {
      const event: DomainEvent = {
        event_id: this.generateEventId(),
        event_type: routingKey,
        aggregate_type: this.getAggregateType(routingKey),
        aggregate_id: aggregateId || payload.user_id || '',
        payload,
        metadata: {
          service: 'auth-service',
          version: '1.0',
          timestamp: new Date().toISOString()
        }
      };

      const message = JSON.stringify(event);

      const success = this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now()
        }
      );

      if (success) {
        logger.info(`📤 Published event: ${routingKey}`, { 
          event_id: event.event_id,
          aggregate_id: event.aggregate_id
        });
      } else {
        logger.warn('Failed to publish event (buffer full)', { routingKey });
      }

      return success;
    } catch (error) {
      logger.error('Failed to publish event:', { error, routingKey });
      return false;
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAggregateType(eventType: string): string {
    if (eventType.startsWith('user.')) return 'User';
    if (eventType.startsWith('session.')) return 'Session';
    return 'Unknown';
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      logger.info('RabbitMQ connection closed gracefully');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
    }
  }
}

export const rabbitmqClient = new RabbitMQClient();
