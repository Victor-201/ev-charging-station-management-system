import { Request, Response } from 'express';
import {
  registerFcmToken,
  removeFcmToken,
  getUserFcmTokens,
  subscribeUserToTopic,
  unsubscribeUserFromTopic,
  sendPushNotificationToUser,
  sendChargingNotification,
  sendPaymentNotification,
  sendBookingNotification,
  sendPromotionalNotification,
} from '../services/fcmService';
import logger from '../utils/logger';

/**
 * Register FCM token for push notifications
 * POST /api/v1/notifications/fcm/register
 */
export async function registerToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { fcm_token, device_type } = req.body;

    if (!fcm_token) {
      res.status(400).json({ error: 'FCM token is required' });
      return;
    }

    if (!['ios', 'android', 'web'].includes(device_type)) {
      res.status(400).json({ error: 'Invalid device type. Must be ios, android, or web' });
      return;
    }

    await registerFcmToken(userId, fcm_token, device_type);

    res.json({
      message: 'FCM token registered successfully',
      user_id: userId,
      device_type,
    });
  } catch (error) {
    logger.error('Error registering FCM token:', error);
    res.status(500).json({ error: 'Failed to register FCM token' });
  }
}

/**
 * Remove FCM token
 * DELETE /api/v1/notifications/fcm/remove
 */
export async function removeToken(req: Request, res: Response): Promise<void> {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      res.status(400).json({ error: 'FCM token is required' });
      return;
    }

    await removeFcmToken(fcm_token);

    res.json({ message: 'FCM token removed successfully' });
  } catch (error) {
    logger.error('Error removing FCM token:', error);
    res.status(500).json({ error: 'Failed to remove FCM token' });
  }
}

/**
 * Get user's FCM tokens
 * GET /api/v1/notifications/fcm/tokens
 */
export async function getTokens(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    const tokens = await getUserFcmTokens(userId);

    res.json({
      user_id: userId,
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    logger.error('Error getting FCM tokens:', error);
    res.status(500).json({ error: 'Failed to get FCM tokens' });
  }
}

/**
 * Subscribe to notification topic
 * POST /api/v1/notifications/fcm/subscribe
 */
export async function subscribeToTopic(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { topic } = req.body;

    if (!topic) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    await subscribeUserToTopic(userId, topic);

    res.json({
      message: 'Subscribed to topic successfully',
      user_id: userId,
      topic,
    });
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
    res.status(500).json({ error: 'Failed to subscribe to topic' });
  }
}

/**
 * Unsubscribe from notification topic
 * POST /api/v1/notifications/fcm/unsubscribe
 */
export async function unsubscribeFromTopic(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { topic } = req.body;

    if (!topic) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    await unsubscribeUserFromTopic(userId, topic);

    res.json({
      message: 'Unsubscribed from topic successfully',
      user_id: userId,
      topic,
    });
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from topic' });
  }
}

/**
 * Send test notification (for testing purposes)
 * POST /api/v1/notifications/fcm/test
 */
export async function sendTestNotification(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { title, body, imageUrl, data } = req.body;

    if (!title || !body) {
      res.status(400).json({ error: 'Title and body are required' });
      return;
    }

    await sendPushNotificationToUser(
      userId,
      { title, body, imageUrl },
      data
    );

    res.json({
      message: 'Test notification sent successfully',
      user_id: userId,
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
}

/**
 * Send charging notification (for internal/webhook use)
 * POST /api/v1/notifications/fcm/charging
 */
export async function sendChargingNotif(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, status, details } = req.body;

    if (!user_id || !status) {
      res.status(400).json({ error: 'user_id and status are required' });
      return;
    }

    if (!['started', 'completed', 'stopped', 'error'].includes(status)) {
      res.status(400).json({ error: 'Invalid charging status' });
      return;
    }

    await sendChargingNotification(user_id, status, details || {});

    res.json({
      message: 'Charging notification sent successfully',
      user_id,
      status,
    });
  } catch (error) {
    logger.error('Error sending charging notification:', error);
    res.status(500).json({ error: 'Failed to send charging notification' });
  }
}

/**
 * Send payment notification (for internal/webhook use)
 * POST /api/v1/notifications/fcm/payment
 */
export async function sendPaymentNotif(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, status, amount, transaction_id } = req.body;

    if (!user_id || !status || amount === undefined || !transaction_id) {
      res.status(400).json({ 
        error: 'user_id, status, amount, and transaction_id are required' 
      });
      return;
    }

    if (!['success', 'failed'].includes(status)) {
      res.status(400).json({ error: 'Invalid payment status' });
      return;
    }

    await sendPaymentNotification(user_id, status, amount, transaction_id);

    res.json({
      message: 'Payment notification sent successfully',
      user_id,
      status,
    });
  } catch (error) {
    logger.error('Error sending payment notification:', error);
    res.status(500).json({ error: 'Failed to send payment notification' });
  }
}

/**
 * Send booking notification (for internal/webhook use)
 * POST /api/v1/notifications/fcm/booking
 */
export async function sendBookingNotif(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, status, details } = req.body;

    if (!user_id || !status) {
      res.status(400).json({ error: 'user_id and status are required' });
      return;
    }

    if (!['confirmed', 'cancelled', 'reminder'].includes(status)) {
      res.status(400).json({ error: 'Invalid booking status' });
      return;
    }

    await sendBookingNotification(user_id, status, details || {});

    res.json({
      message: 'Booking notification sent successfully',
      user_id,
      status,
    });
  } catch (error) {
    logger.error('Error sending booking notification:', error);
    res.status(500).json({ error: 'Failed to send booking notification' });
  }
}

/**
 * Send promotional notification (admin only)
 * POST /api/v1/notifications/fcm/promotional
 */
export async function sendPromotionalNotif(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, title, message, image_url } = req.body;

    if (!user_id || !title || !message) {
      res.status(400).json({ error: 'user_id, title, and message are required' });
      return;
    }

    await sendPromotionalNotification(user_id, title, message, image_url);

    res.json({
      message: 'Promotional notification sent successfully',
      user_id,
    });
  } catch (error) {
    logger.error('Error sending promotional notification:', error);
    res.status(500).json({ error: 'Failed to send promotional notification' });
  }
}
