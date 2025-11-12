import pool from '../config/database';
import { Notification, NotificationRequest } from '../types';
import logger from '../utils/logger';
import axios from 'axios';
import {
  sendPushNotificationToUser,
  sendChargingNotification,
  sendPaymentNotification,
  sendBookingNotification,
} from './fcmService';

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

  // Send notification (via FCM + optional gateway)
  async sendNotification(data: NotificationRequest): Promise<{ status: string; notification_id: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Determine notification type
      const notificationType = data.data?.type || 'SYSTEM';

      // Store notification in database
      const result = await client.query(
        `INSERT INTO notifications (user_id, title, message, type, status, data)
         VALUES ($1, $2, $3, $4, 'UNREAD', $5)
         RETURNING id`,
        [
          data.user_id,
          data.title,
          data.message,
          notificationType.toUpperCase(),
          JSON.stringify(data.data || {})
        ]
      );

      const notificationId = result.rows[0].id;

      await client.query('COMMIT');

      // Send via FCM (push notification) if push channel is included
      if (!data.channels || data.channels.includes('push')) {
        try {
          await sendPushNotificationToUser(
            data.user_id,
            {
              title: data.title,
              body: data.message,
              imageUrl: data.data?.imageUrl,
            },
            {
              notification_id: notificationId,
              type: notificationType,
              ...data.data,
            },
            false // Don't save to DB again, we already did above
          );
          logger.info(`FCM notification sent for notification ${notificationId}`);
        } catch (error) {
          logger.error('Error sending FCM notification:', error);
          // Continue anyway, notification is stored in DB
        }
      }

      // Send to other channels (email, SMS, etc.) via notification gateway
      const otherChannels = data.channels?.filter(ch => ch !== 'push') || [];
      if (otherChannels.length > 0) {
        try {
          const notificationGatewayUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-gateway:3006';
          await axios.post(`${notificationGatewayUrl}/api/v1/internal/send`, {
            user_id: data.user_id,
            notification_id: notificationId,
            title: data.title,
            message: data.message,
            channels: otherChannels,
            data: data.data,
          });
          logger.info(`Notification sent to gateway for channels: ${otherChannels.join(', ')}`);
        } catch (error) {
          logger.error('Error calling notification gateway:', error);
          // Continue anyway, notification is stored in DB
        }
      }

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

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE notifications 
         SET status = 'READ', read_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND status = 'UNREAD'`,
        [userId]
      );
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
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
        case 'booking.confirmed':
          await sendBookingNotification(
            event.data.user_id,
            'confirmed',
            {
              stationName: event.data.station_name,
              bookingTime: event.data.booking_time,
              bookingId: event.data.booking_id || event.data.reservation_id,
            }
          );
          break;

        case 'reservation.cancelled':
        case 'booking.cancelled':
          await sendBookingNotification(
            event.data.user_id,
            'cancelled',
            {
              stationName: event.data.station_name,
              bookingId: event.data.booking_id || event.data.reservation_id,
            }
          );
          break;

        case 'booking.reminder':
          await sendBookingNotification(
            event.data.user_id,
            'reminder',
            {
              stationName: event.data.station_name,
              bookingTime: event.data.booking_time,
              bookingId: event.data.booking_id,
            }
          );
          break;

        case 'charging.started':
          await sendChargingNotification(
            event.data.user_id,
            'started',
            {
              stationName: event.data.station_name,
            }
          );
          break;

        case 'charging.completed':
          await sendChargingNotification(
            event.data.user_id,
            'completed',
            {
              stationName: event.data.station_name,
              energy: event.data.energy_kwh,
              cost: event.data.total_cost,
            }
          );
          break;

        case 'charging.stopped':
          await sendChargingNotification(
            event.data.user_id,
            'stopped',
            {
              stationName: event.data.station_name,
              energy: event.data.energy_kwh,
              cost: event.data.total_cost,
            }
          );
          break;

        case 'charging.error':
          await sendChargingNotification(
            event.data.user_id,
            'error',
            {
              stationName: event.data.station_name,
              errorMessage: event.data.error_message,
            }
          );
          break;

        case 'payment.success':
          await sendPaymentNotification(
            event.data.user_id,
            'success',
            event.data.amount,
            event.data.transaction_id
          );
          break;

        case 'payment.failed':
          await sendPaymentNotification(
            event.data.user_id,
            'failed',
            event.data.amount,
            event.data.transaction_id
          );
          break;

        default:
          logger.warn('Unknown webhook event type:', event.event);
          // Fallback to generic notification
          if (event.data?.user_id && event.data?.message) {
            await this.sendNotification({
              user_id: event.data.user_id,
              title: event.data.title || 'Notification',
              message: event.data.message,
              channels: ['push'],
              data: event.data,
            });
          }
      }

      return { status: 'received' };
    } catch (error) {
      logger.error('Error handling booking webhook:', error);
      throw error;
    }
  }
}

export default new NotificationService();
