import admin from 'firebase-admin';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

/**
 * Firebase Admin SDK Configuration
 * For server-side Firebase Cloud Messaging (FCM) push notifications
 */

// Firebase configuration from your web app
export const firebaseConfig = {
  apiKey: 'AIzaSyAb_fY-KmhTyXFaKjVweF890Z4MhtrR8sg',
  authDomain: 'ev-charging-station-ad2b7.firebaseapp.com',
  projectId: 'ev-charging-station-ad2b7',
  storageBucket: 'ev-charging-station-ad2b7.firebasestorage.app',
  messagingSenderId: '497529490549',
  appId: '1:497529490549:web:cdd0995abcaa22ac297c3c',
  measurementId: 'G-P29CT0J96N',
};

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials for server-side operations
 */
export function initializeFirebase(): admin.app.App {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      logger.info('Firebase Admin already initialized');
      return admin.app();
    }

    // Method 1: Using service account key file (recommended for production)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                path.join(__dirname, '../../config/firebase-service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });

      logger.info('Firebase Admin initialized with service account');
    } 
    // Method 2: Using environment variables (for development/testing)
    else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        projectId: firebaseConfig.projectId,
      });

      logger.info('Firebase Admin initialized with environment variables');
    }
    // Method 3: Application Default Credentials (for Google Cloud Platform)
    else {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });

      logger.warn('Firebase Admin initialized with default credentials (limited functionality)');
    }

    return admin.app();
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  return admin.messaging();
}

/**
 * Send push notification to a single device
 */
export async function sendNotificationToDevice(
  fcmToken: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<string> {
  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          color: '#00FF00',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/badge.png',
        },
      },
    };

    const response = await getMessaging().send(message);
    logger.info(`Notification sent successfully to ${fcmToken}: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error sending notification to ${fcmToken}:`, error);
    throw error;
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendNotificationToMultipleDevices(
  fcmTokens: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<admin.messaging.BatchResponse> {
  try {
    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          color: '#00FF00',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);
    logger.info(`Notifications sent to ${response.successCount}/${fcmTokens.length} devices`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.error(`Failed to send to token ${fcmTokens[idx]}:`, resp.error);
        }
      });
    }

    return response;
  } catch (error) {
    logger.error('Error sending notifications to multiple devices:', error);
    throw error;
  }
}

/**
 * Send notification to a topic
 */
export async function sendNotificationToTopic(
  topic: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<string> {
  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await getMessaging().send(message);
    logger.info(`Notification sent to topic ${topic}: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error sending notification to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Subscribe tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const response = await getMessaging().subscribeToTopic(tokens, topic);
    logger.info(`${response.successCount} tokens subscribed to topic ${topic}`);
    
    if (response.failureCount > 0) {
      logger.error(`${response.failureCount} tokens failed to subscribe to topic ${topic}`);
    }

    return response;
  } catch (error) {
    logger.error(`Error subscribing to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Unsubscribe tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const response = await getMessaging().unsubscribeFromTopic(tokens, topic);
    logger.info(`${response.successCount} tokens unsubscribed from topic ${topic}`);
    
    if (response.failureCount > 0) {
      logger.error(`${response.failureCount} tokens failed to unsubscribe from topic ${topic}`);
    }

    return response;
  } catch (error) {
    logger.error(`Error unsubscribing from topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Validate FCM token
 */
export async function validateFcmToken(token: string): Promise<boolean> {
  try {
    await getMessaging().send({
      token,
      data: { test: 'validate' },
    }, true); // Dry run mode
    return true;
  } catch (error: any) {
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      return false;
    }
    throw error;
  }
}

// Initialize Firebase on module load
try {
  initializeFirebase();
} catch (error) {
  logger.error('Failed to initialize Firebase on startup:', error);
}

export default admin;
