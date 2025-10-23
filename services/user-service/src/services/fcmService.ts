import { pool } from '../config/database';
import logger from '../utils/logger';
import {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToTopic,
  subscribeToTopic as fcmSubscribeToTopic,
  unsubscribeFromTopic as fcmUnsubscribeFromTopic,
  validateFcmToken,
} from '../config/firebase';

/**
 * Firebase Cloud Messaging Service
 * Handles push notifications via FCM
 */

/**
 * Register FCM token for a user
 */
export async function registerFcmToken(
  userId: string,
  fcmToken: string,
  deviceType: 'ios' | 'android' | 'web'
): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Validate token
    const isValid = await validateFcmToken(fcmToken);
    if (!isValid) {
      throw new Error('Invalid FCM token');
    }

    // Check if token already exists
    const existingToken = await client.query(
      'SELECT id FROM user_fcm_tokens WHERE fcm_token = $1',
      [fcmToken]
    );

    if (existingToken.rowCount === 0) {
      // Insert new token
      await client.query(
        `INSERT INTO user_fcm_tokens (user_id, fcm_token, device_type, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (fcm_token) 
         DO UPDATE SET 
           user_id = EXCLUDED.user_id,
           device_type = EXCLUDED.device_type,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, fcmToken, deviceType]
      );

      logger.info(`FCM token registered for user ${userId}, device: ${deviceType}`);
    } else {
      logger.info(`FCM token already exists for user ${userId}`);
    }
  } catch (error) {
    logger.error(`Error registering FCM token for user ${userId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove FCM token
 */
export async function removeFcmToken(fcmToken: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(
      'UPDATE user_fcm_tokens SET is_active = false WHERE fcm_token = $1',
      [fcmToken]
    );

    logger.info(`FCM token removed: ${fcmToken.substring(0, 20)}...`);
  } catch (error) {
    logger.error('Error removing FCM token:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get active FCM tokens for a user
 */
export async function getUserFcmTokens(userId: string): Promise<string[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    return result.rows.map(row => row.fcm_token);
  } catch (error) {
    logger.error(`Error getting FCM tokens for user ${userId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string },
  saveToDb: boolean = true
): Promise<void> {
  try {
    // Get user's FCM tokens
    const fcmTokens = await getUserFcmTokens(userId);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for user ${userId}`);
      
      // Still save notification to database
      if (saveToDb) {
        await saveNotificationToDb(userId, notification, data);
      }
      return;
    }

    // Send to all user's devices
    const response = await sendNotificationToMultipleDevices(
      fcmTokens,
      notification,
      data
    );

    logger.info(`Push notification sent to user ${userId}: ${response.successCount}/${fcmTokens.length} devices`);

    // Save notification to database
    if (saveToDb) {
      await saveNotificationToDb(userId, notification, data);
    }

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        if (!resp.success && 
            (resp.error?.code === 'messaging/invalid-registration-token' ||
             resp.error?.code === 'messaging/registration-token-not-registered')) {
          await removeFcmToken(fcmTokens[i]);
          logger.info(`Removed invalid FCM token: ${fcmTokens[i].substring(0, 20)}...`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error sending push notification to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToMultipleUsers(
  userIds: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<void> {
  try {
    const promises = userIds.map(userId => 
      sendPushNotificationToUser(userId, notification, data)
    );

    await Promise.allSettled(promises);
    logger.info(`Push notifications sent to ${userIds.length} users`);
  } catch (error) {
    logger.error('Error sending push notifications to multiple users:', error);
    throw error;
  }
}

/**
 * Send notification to a topic (e.g., 'all-users', 'premium-users')
 */
export async function sendPushNotificationToTopic(
  topic: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<void> {
  try {
    await sendNotificationToTopic(topic, notification, data);
    logger.info(`Push notification sent to topic: ${topic}`);
  } catch (error) {
    logger.error(`Error sending push notification to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Subscribe user to notification topic
 */
export async function subscribeUserToTopic(
  userId: string,
  topic: string
): Promise<void> {
  try {
    const fcmTokens = await getUserFcmTokens(userId);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for user ${userId} to subscribe to topic ${topic}`);
      return;
    }

    await fcmSubscribeToTopic(fcmTokens, topic);
    logger.info(`User ${userId} subscribed to topic: ${topic}`);
  } catch (error) {
    logger.error(`Error subscribing user ${userId} to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Unsubscribe user from notification topic
 */
export async function unsubscribeUserFromTopic(
  userId: string,
  topic: string
): Promise<void> {
  try {
    const fcmTokens = await getUserFcmTokens(userId);

    if (fcmTokens.length === 0) {
      logger.warn(`No FCM tokens found for user ${userId} to unsubscribe from topic ${topic}`);
      return;
    }

    await fcmUnsubscribeFromTopic(fcmTokens, topic);
    logger.info(`User ${userId} unsubscribed from topic: ${topic}`);
  } catch (error) {
    logger.error(`Error unsubscribing user ${userId} from topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Save notification to database
 */
async function saveNotificationToDb(
  userId: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Determine notification type from data
    const type = data?.type || 'SYSTEM';

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type, data, status)
       VALUES ($1, $2, $3, $4, $5, 'UNREAD')`,
      [
        userId,
        notification.title,
        notification.body,
        type.toUpperCase(),
        data ? JSON.stringify(data) : null,
      ]
    );

    logger.info(`Notification saved to database for user ${userId}`);
  } catch (error) {
    logger.error(`Error saving notification to database for user ${userId}:`, error);
    // Don't throw - saving to DB is secondary to sending push notification
  } finally {
    client.release();
  }
}

/**
 * Send charging-related notification
 */
export async function sendChargingNotification(
  userId: string,
  chargingStatus: 'started' | 'completed' | 'stopped' | 'error',
  details: {
    stationName?: string;
    energy?: number;
    cost?: number;
    errorMessage?: string;
  }
): Promise<void> {
  let title = '';
  let body = '';

  switch (chargingStatus) {
    case 'started':
      title = '⚡ Charging Started';
      body = `Your EV is now charging at ${details.stationName || 'charging station'}`;
      break;
    case 'completed':
      title = ' Charging Completed';
      body = `Charged ${details.energy} kWh. Total cost: $${details.cost}`;
      break;
    case 'stopped':
      title = ' Charging Stopped';
      body = `Charging session ended at ${details.stationName || 'charging station'}`;
      break;
    case 'error':
      title = ' Charging Error';
      body = details.errorMessage || 'An error occurred during charging';
      break;
  }

  await sendPushNotificationToUser(
    userId,
    { title, body },
    {
      type: 'CHARGING',
      status: chargingStatus,
      stationName: details.stationName || '',
      energy: details.energy?.toString() || '',
      cost: details.cost?.toString() || '',
    }
  );
}

/**
 * Send payment notification
 */
export async function sendPaymentNotification(
  userId: string,
  paymentStatus: 'success' | 'failed',
  amount: number,
  transactionId: string
): Promise<void> {
  const title = paymentStatus === 'success' 
    ? '💳 Payment Successful' 
    : '❌ Payment Failed';
  
  const body = paymentStatus === 'success'
    ? `Payment of $${amount} completed successfully`
    : `Payment of $${amount} failed. Please try again`;

  await sendPushNotificationToUser(
    userId,
    { title, body },
    {
      type: 'PAYMENT',
      status: paymentStatus,
      amount: amount.toString(),
      transactionId,
    }
  );
}

/**
 * Send booking notification
 */
export async function sendBookingNotification(
  userId: string,
  bookingStatus: 'confirmed' | 'cancelled' | 'reminder',
  details: {
    stationName?: string;
    bookingTime?: string;
    bookingId?: string;
  }
): Promise<void> {
  let title = '';
  let body = '';

  switch (bookingStatus) {
    case 'confirmed':
      title = '📅 Booking Confirmed';
      body = `Your booking at ${details.stationName} is confirmed for ${details.bookingTime}`;
      break;
    case 'cancelled':
      title = '🚫 Booking Cancelled';
      body = `Your booking at ${details.stationName} has been cancelled`;
      break;
    case 'reminder':
      title = '🔔 Booking Reminder';
      body = `Your charging session at ${details.stationName} starts in 30 minutes`;
      break;
  }

  await sendPushNotificationToUser(
    userId,
    { title, body },
    {
      type: 'BOOKING',
      status: bookingStatus,
      stationName: details.stationName || '',
      bookingTime: details.bookingTime || '',
      bookingId: details.bookingId || '',
    }
  );
}

/**
 * Send promotional notification
 */
export async function sendPromotionalNotification(
  userId: string,
  title: string,
  message: string,
  imageUrl?: string
): Promise<void> {
  await sendPushNotificationToUser(
    userId,
    { title, body: message, imageUrl },
    { type: 'PROMOTIONAL' }
  );
}
