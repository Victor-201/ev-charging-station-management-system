// src/components/social/OAuthButtons.jsx
import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../config/env';
import authService from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAccessToken } from '../../store/slices/authSlice';
import { STORAGE_KEYS } from '../../config/constants';
import { logger } from '../../utils/logger';

export default function OAuthButtons({ onSuccess, onError, mode = 'login' }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState({ google: false, facebook: false });

  useEffect(() => {
    // Configure Google Sign-In
    if (GOOGLE_WEB_CLIENT_ID) {
      GoogleSignin.configure({ 
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    } else {
      console.warn('Google OAuth not configured - missing GOOGLE_WEB_CLIENT_ID');
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Configuration Error', 'Google OAuth is not configured properly');
      return;
    }

    setLoading(prev => ({ ...prev, google: true }));
    
    try {
      console.log('🔍 Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      console.log('🚀 Starting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful:', { 
        email: userInfo.user?.email,
        hasIdToken: !!userInfo.idToken 
      });
      
      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }
      
      console.log('📡 Sending OAuth request to backend...');
      const { data } = await authService.socialLogin('google', userInfo.idToken);
      console.log('✅ Backend OAuth response:', { 
        hasAccessToken: !!data?.accessToken,
        userId: data?.user_id 
      });
      
      if (data?.accessToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        dispatch(setAccessToken(data.accessToken));
        console.log('✅ OAuth login successful');
        onSuccess?.(data);
      } else {
        throw new Error('No access token received from backend');
      }
    } catch (error) {
      console.error('❌ Google OAuth Error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === '-5') {
        console.log('User cancelled Google sign-in');
        return; // Don't show error for user cancellation
      }
      
      let errorMessage = 'Google đăng nhập thất bại';
      if (error.message?.includes('network')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Lỗi xác thực. Vui lòng thử lại.';
      }
      
      Alert.alert('Lỗi Google Login', errorMessage);
      onError?.(error);
    } finally {
      setLoading(prev => ({ ...prev, google: false }));
    }
  };

  const signInWithFacebook = async () => {
    setLoading(prev => ({ ...prev, facebook: true }));
    
    try {
      console.log('🚀 Starting Facebook Login...');
      
      // Logout first to ensure clean state
      LoginManager.logOut();
      
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      console.log('Facebook login result:', result);
      
      if (result.isCancelled) {
        console.log('User cancelled Facebook login');
        return; // Don't show error for user cancellation
      }
      
      if (result.grantedPermissions?.length === 0) {
        throw new Error('No permissions granted by Facebook');
      }
      
      const dataToken = await AccessToken.getCurrentAccessToken();
      console.log('Facebook access token:', { hasToken: !!dataToken });
      
      if (!dataToken) {
        throw new Error('No access token from Facebook');
      }
      
      const accessToken = dataToken.accessToken.toString();
      console.log('📡 Sending Facebook OAuth request to backend...');
      
      const { data } = await authService.socialLogin('facebook', accessToken);
      console.log('✅ Backend Facebook OAuth response:', { 
        hasAccessToken: !!data?.accessToken,
        userId: data?.user_id 
      });
      
      if (data?.accessToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        dispatch(setAccessToken(data.accessToken));
        console.log('✅ Facebook OAuth login successful');
        onSuccess?.(data);
      } else {
        throw new Error('No access token received from backend');
      }
    } catch (error) {
      console.error('❌ Facebook OAuth Error:', error);
      
      let errorMessage = 'Facebook đăng nhập thất bại';
      if (error.message?.includes('network')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng thử lại.';
      } else if (error.message?.includes('permissions')) {
        errorMessage = 'Cần cấp quyền để tiếp tục đăng nhập.';
      }
      
      Alert.alert('Lỗi Facebook Login', errorMessage);
      onError?.(error);
    } finally {
      setLoading(prev => ({ ...prev, facebook: false }));
    }
  };

  return (
    <View style={{ width: '100%', gap: 8 }}>
      <Button 
        mode="outlined" 
        onPress={signInWithGoogle} 
        loading={loading.google}
        disabled={loading.google || loading.facebook}
        uppercase={false} 
        style={{ marginVertical: 6 }}
      >
        {mode === 'login' ? 'Đăng nhập với Google' : 'Đăng ký với Google'}
      </Button>
      <Button 
        mode="outlined" 
        onPress={signInWithFacebook} 
        loading={loading.facebook}
        disabled={loading.google || loading.facebook}
        uppercase={false} 
        style={{ marginVertical: 6 }}
      >
        {mode === 'login' ? 'Đăng nhập với Facebook' : 'Đăng ký với Facebook'}
      </Button>
    </View>
  );
}
