import React, { useEffect } from 'react';
import { View, Alert, Platform, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager, Settings } from 'react-native-fbsdk-next';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../config/env';
import useAuth from '../../hooks/useAuth';
import { logger } from '../../utils/logger';

export default function OAuthButtons({ onSuccess, onError, mode = 'login' }) {
  const { doSocialLogin, loading } = useAuth();

  useEffect(() => {
    // Configure Facebook SDK
    if (Platform.OS === 'ios') {
      Settings.setAdvertiserTrackingEnabled(true);
      Settings.setAutoLogAppEventsEnabled(false);
    }

    // Configure Google Sign-In
    if (GOOGLE_WEB_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true, // Required for refresh token
      });
    } else {
      logger.warn('Google OAuth not configured - missing GOOGLE_WEB_CLIENT_ID');
    }
  }, []);

  const handleSocialLogin = async (provider, token) => {
    const result = await doSocialLogin({ provider, token });
    if (result.type === 'auth/socialLogin/fulfilled') {
      logger.info(`${provider} login successful`);
      onSuccess?.(result.payload);
    } else if (result.type === 'auth/socialLogin/rejected') {
      const errorMessage = result.payload?.message || `Đăng nhập ${provider} thất bại.`;
      logger.error(`${provider} login failed:`, errorMessage);
      Alert.alert(`Lỗi ${provider}`, errorMessage);
      onError?.(result.payload);
    }
  };

  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Lỗi cấu hình', 'Đăng nhập Google chưa được cấu hình.');
      return;
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();

      if (idToken) {
        await handleSocialLogin('google', idToken);
      } else {
        throw new Error('Không nhận được idToken từ Google.');
      }
    } catch (error) {
      if (error.code === '-5' || error.code === '12501') { // User cancelled the login flow
        logger.info('User cancelled Google sign-in');
        return;
      }
      logger.error('Google Sign-In Error:', error);
      Alert.alert('Lỗi Google Login', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.');
      onError?.(error);
    }
  };

  const signInWithFacebook = async () => {
    try {
      // Logout first to ensure a fresh login attempt
      LoginManager.logOut();

      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        logger.info('User cancelled Facebook login');
        return;
      }

      const data = await AccessToken.getCurrentAccessToken();
      if (data?.accessToken) {
        await handleSocialLogin('facebook', data.accessToken.toString());
      } else {
        throw new Error('Không nhận được access token từ Facebook.');
      }
    } catch (error) {
      logger.error('Facebook Login Error:', error);
      Alert.alert('Lỗi Facebook Login', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.');
      onError?.(error);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        icon="google"
        mode="outlined"
        onPress={signInWithGoogle}
        loading={loading}
        disabled={loading}
        uppercase={false}
        style={styles.button}
        labelStyle={styles.label}
        contentStyle={styles.content}
      >
        {mode === 'login' ? 'Đăng nhập với Google' : 'Đăng ký với Google'}
      </Button>
      <Button
        icon="facebook"
        mode="outlined"
        onPress={signInWithFacebook}
        loading={loading}
        disabled={loading}
        uppercase={false}
        style={styles.button}
        labelStyle={styles.label}
        contentStyle={styles.content}
      >
        {mode === 'login' ? 'Đăng nhập với Facebook' : 'Đăng ký với Facebook'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    marginVertical: 8,
  },
  content: {
    height: 48, // Standard button height
  },
  label: {
    fontWeight: '600',
  },
});
