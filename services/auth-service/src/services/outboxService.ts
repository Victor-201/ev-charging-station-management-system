import { query } from '../config/database';
import { rabbitmqClient } from '../config/rabbitmq';
import { logger } from '../utils/logger';

export class OutboxService {
  private publisherInterval: NodeJS.Timeout | null = null;

  /**
   * Insert event vào outbox table (trong transaction)
   */
  async insertEvent(
    client: any,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    await client.query(
      `INSERT INTO outbox_events 
       (aggregate_type, aggregate_id, event_type, payload, published) 
       VALUES ($1, $2, $3, $4, false)`,
      [aggregateType, aggregateId, eventType, JSON.stringify(payload)]
    );

    logger.debug('Event inserted into outbox', { 
      eventType, 
      aggregateId 
    });
  }

  /**
   * Publish pending events từ outbox table
   */
  async publishPendingEvents(): Promise<void> {
    try {
      // Skip if RabbitMQ not connected
      if (!rabbitmqClient.isConnected()) {
        logger.debug('RabbitMQ not connected, skipping outbox publishing');
        return;
      }

      const result = await query(
        `SELECT * FROM outbox_events 
         WHERE published = false 
         ORDER BY created_at ASC 
         LIMIT 100`
      );

      if (result.rows.length === 0) {
        return;
      }

      logger.info(`📦 Processing ${result.rows.length} outbox events`);

      let successCount = 0;
      let failCount = 0;

      for (const event of result.rows) {
        try {
          const payload = JSON.parse(event.payload);
          
          const success = await rabbitmqClient.publish(
            event.event_type,
            payload,
            event.aggregate_id
          );

          if (success) {
            // Mark as published
            await query(
              'UPDATE outbox_events SET published = true WHERE id = $1',
              [event.id]
            );
            
            successCount++;
            
            logger.debug('Outbox event published', {
              event_id: event.id,
              event_type: event.event_type
            });
          } else {
            failCount++;
            logger.warn('Failed to publish outbox event (will retry)', {
              event_id: event.id,
              event_type: event.event_type
            });
          }
        } catch (error) {
          failCount++;
          logger.error('Error processing outbox event:', {
            error,
            event_id: event.id,
            event_type: event.event_type
          });
        }
      }

      if (successCount > 0 || failCount > 0) {
        logger.info('Outbox publishing completed', { 
          success: successCount, 
          failed: failCount 
        });
      }
    } catch (error) {
      logger.error('Failed to publish pending events:', error);
    }
  }

  /**
   * Start background worker to publish outbox events
   */
  startPublisher(intervalMs: number = 5000): void {
    if (this.publisherInterval) {
      logger.warn('Outbox publisher already running');
      return;
    }

    this.publisherInterval = setInterval(() => {
      this.publishPendingEvents();
    }, intervalMs);

    logger.info(`✅ Outbox publisher started (interval: ${intervalMs}ms)`);

    // Run immediately on start
    this.publishPendingEvents();
  }

  /**
   * Stop background worker
   */
  stopPublisher(): void {
    if (this.publisherInterval) {
      clearInterval(this.publisherInterval);
      this.publisherInterval = null;
      logger.info('Outbox publisher stopped');
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    published: number;
    pending: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE published = true) as published,
        COUNT(*) FILTER (WHERE published = false) as pending
      FROM outbox_events
    `);

    return {
      total: parseInt(result.rows[0].total),
      published: parseInt(result.rows[0].published),
      pending: parseInt(result.rows[0].pending)
    };
  }
}

export const outboxService = new OutboxService();
