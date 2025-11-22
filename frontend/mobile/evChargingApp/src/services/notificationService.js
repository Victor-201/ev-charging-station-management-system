import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

class NotificationService {
  async requestUserPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      }
    } else if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }
    }
    return false;
  }

  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  async registerFCMToken(fcmToken) {
    try {
      // Detect device type
      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      await apiClient.post(ENDPOINTS.NOTIFICATION.FCM_REGISTER, {
        fcm_token: fcmToken,
        device_type: deviceType
      });
      console.log('FCM token registered with server.');
    } catch (error) {
      console.error('Failed to register FCM token with server:', error);
    }
  }

  listenForMessages() {
    messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      this.onDisplayNotification(remoteMessage);
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      // Handle navigation
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          // Handle navigation
        }
      });
  }

  async onDisplayNotification(remoteMessage) {
    // Create a channel (required for Android)
    if (Platform.OS === 'android') {
        await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
        });
    }

    // Display a notification
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId: 'default',
        smallIcon: 'ic_launcher', // optional, defaults to 'ic_launcher'.
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  async getSettings(userId) {
    const url = ENDPOINTS.NOTIFICATION.GET_SETTINGS.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  }

  async updateSettings(userId, settings) {
    const url = ENDPOINTS.NOTIFICATION.UPDATE_SETTINGS.replace(':user_id', userId);
    const response = await apiClient.put(url, settings);
    return response.data;
  }

  async getNotifications(userId) {
    const url = ENDPOINTS.NOTIFICATION.LIST.replace(':user_id', userId);
    const response = await apiClient.get(url);
    return response.data;
  }

  async markAsRead(notificationId) {
    const url = ENDPOINTS.NOTIFICATION.MARK_READ.replace(':notification_id', notificationId);
    const response = await apiClient.put(url);
    return response.data;
  }

  async markAllAsRead(userId) {
    const url = ENDPOINTS.NOTIFICATION.MARK_ALL_READ.replace(':user_id', userId);
    const response = await apiClient.put(url);
    return response.data;
  }

}

export default new NotificationService();
