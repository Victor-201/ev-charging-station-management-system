import React, { useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../config/env';
import useAuth from '../../hooks/useAuth';
import { logger } from '../../utils/logger';

export default function OAuthButtons({ onSuccess, onError, mode = 'login' }) {
  const { doSocialLogin, loading } = useAuth();

  useEffect(() => {
    // Configure Google Sign-In
    if (GOOGLE_WEB_CLIENT_ID) {
      const config = {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        scopes: ['profile', 'email'],
        iosClientId: GOOGLE_IOS_CLIENT_ID,
      };

      GoogleSignin.configure(config);
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
      const userInfo = await GoogleSignin.signIn();
      logger.debug('Google User Info:', userInfo);

      // In newer versions, idToken is directly in userInfo or userInfo.data
      const idToken = userInfo.idToken || userInfo.data?.idToken;

      if (idToken) {
        await handleSocialLogin('google', idToken);
      } else {
        logger.error('Google Sign-In Error: idToken is missing in the response.', userInfo);
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
