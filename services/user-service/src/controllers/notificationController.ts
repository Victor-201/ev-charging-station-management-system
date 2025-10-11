import { Request, Response } from 'express';
import notificationService from '../services/notificationService';
import logger from '../utils/logger';

export class NotificationController {
  // GET /api/v1/notifications/:user_id - Get user notifications
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { unread_only } = req.query;

      const result = await notificationService.getNotifications(
        user_id,
        unread_only === 'true'
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getNotifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  // POST /api/v1/notifications/send - Send notification
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, title, message, channels, data } = req.body;

      const result = await notificationService.sendNotification({
        user_id,
        title,
        message,
        channels,
        data,
      });

      res.status(202).json(result);
    } catch (error) {
      logger.error('Error in sendNotification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }

  // POST /api/v1/notifications/schedule - Schedule notification
  async scheduleNotification(req: Request, res: Response): Promise<void> {
    try {
      const { to_user, send_at, title, message, channels } = req.body;

      const result = await notificationService.scheduleNotification({
        to_user,
        send_at: new Date(send_at),
        title,
        message,
        channels,
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in scheduleNotification:', error);
      res.status(500).json({ error: 'Failed to schedule notification' });
    }
  }

  // POST /api/v1/webhooks/bookings - Handle booking webhook
  async handleBookingWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;

      // TODO: Verify webhook signature
      const webhookSecret = process.env.BOOKING_SERVICE_WEBHOOK_SECRET;
      const signature = req.headers['x-webhook-signature'];

      if (webhookSecret && signature) {
        // Verify signature here
        // Implementation depends on webhook signing method
      }

      const result = await notificationService.handleBookingWebhook(event);

      res.json(result);
    } catch (error) {
      logger.error('Error in handleBookingWebhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
}

export default new NotificationController();
