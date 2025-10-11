import pool from '../config/database';
import { Notification, NotificationRequest } from '../types';
import logger from '../utils/logger';
import axios from 'axios';

export class NotificationService {
  // Get notifications for user
  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<{ notifications: Notification[] }> {
    try {
      let query = `SELECT id, user_id, title, message, type, status, data, created_at, read_at
                   FROM notifications WHERE user_id = $1`;
      
      if (unreadOnly) {
        query += ` AND status = 'UNREAD'`;
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await pool.query(query, [userId]);
      return { notifications: result.rows };
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Send notification (via notification gateway)
  async sendNotification(data: NotificationRequest): Promise<{ status: string; notification_id: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Store notification in database
      const result = await client.query(
        `INSERT INTO notifications (user_id, title, message, type, status, data)
         VALUES ($1, $2, $3, 'SYSTEM', 'UNREAD', $4)
         RETURNING id`,
        [data.user_id, data.title, data.message, JSON.stringify(data.data || {})]
      );

      const notificationId = result.rows[0].id;

      // Send to notification gateway
      try {
        const notificationGatewayUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-gateway:3006';
        await axios.post(`${notificationGatewayUrl}/api/v1/internal/send`, {
          user_id: data.user_id,
          notification_id: notificationId,
          title: data.title,
          message: data.message,
          channels: data.channels,
          data: data.data,
        });
      } catch (error) {
        logger.error('Error calling notification gateway:', error);
        // Continue anyway, notification is stored in DB
      }

      await client.query('COMMIT');

      return {
        status: 'queued',
        notification_id: notificationId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error sending notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Schedule notification
  async scheduleNotification(data: {
    to_user: string;
    send_at: Date;
    title: string;
    message: string;
    channels?: string[];
  }): Promise<{ scheduled_id: string; status: string }> {
    try {
      const result = await pool.query(
        `INSERT INTO scheduled_notifications (user_id, title, message, send_at, status, channels)
         VALUES ($1, $2, $3, $4, 'SCHEDULED', $5)
         RETURNING id`,
        [
          data.to_user,
          data.title,
          data.message,
          data.send_at,
          JSON.stringify(data.channels || ['push']),
        ]
      );

      return {
        scheduled_id: result.rows[0].id,
        status: 'scheduled',
      };
    } catch (error) {
      logger.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE notifications 
         SET status = 'READ', read_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Handle webhook from booking service
  async handleBookingWebhook(event: any): Promise<{ status: string }> {
    try {
      logger.info('Received booking webhook:', event);

      // Process different event types
      switch (event.event) {
        case 'reservation.created':
          await this.sendNotification({
            user_id: event.data.user_id,
            title: 'Reservation Created',
            message: `Your reservation at ${event.data.station_name} has been confirmed.`,
            channels: ['push', 'email'],
            data: event.data,
          });
          break;

        case 'reservation.cancelled':
          await this.sendNotification({
            user_id: event.data.user_id,
            title: 'Reservation Cancelled',
            message: 'Your reservation has been cancelled.',
            channels: ['push'],
            data: event.data,
          });
          break;

        case 'charging.started':
          await this.sendNotification({
            user_id: event.data.user_id,
            title: 'Charging Started',
            message: 'Your vehicle is now charging.',
            channels: ['push'],
            data: event.data,
          });
          break;

        case 'charging.completed':
          await this.sendNotification({
            user_id: event.data.user_id,
            title: 'Charging Complete',
            message: 'Your vehicle is fully charged.',
            channels: ['push', 'email'],
            data: event.data,
          });
          break;

        default:
          logger.warn('Unknown webhook event type:', event.event);
      }

      return { status: 'received' };
    } catch (error) {
      logger.error('Error handling booking webhook:', error);
      throw error;
    }
  }
}

export default new NotificationService();
