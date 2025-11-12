import express from 'express';
import {
  registerToken,
  removeToken,
  getTokens,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendTestNotification,
  sendChargingNotif,
  sendPaymentNotif,
  sendBookingNotif,
  sendPromotionalNotif,
} from '../controllers/fcmController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * FCM Token Management Routes
 */

// Register FCM token for push notifications
router.post('/register', authenticate, registerToken);

// Remove FCM token
router.delete('/remove', authenticate, removeToken);

// Get user's registered FCM tokens
router.get('/tokens', authenticate, getTokens);

// Subscribe to notification topic
router.post('/subscribe', authenticate, subscribeToTopic);

// Unsubscribe from notification topic
router.post('/unsubscribe', authenticate, unsubscribeFromTopic);

// Send test notification
router.post('/test', authenticate, sendTestNotification);

/**
 * Internal/Webhook Routes for sending notifications
 * These should be protected by internal API key or service-to-service auth
 */

// Send charging notification
router.post('/charging', sendChargingNotif);

// Send payment notification
router.post('/payment', sendPaymentNotif);

// Send booking notification
router.post('/booking', sendBookingNotif);

// Send promotional notification (admin only)
router.post('/promotional', sendPromotionalNotif);

export default router;
