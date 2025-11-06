// src/components/social/OAuthButtons.jsx
import React, { useEffect, useState } from 'react';
import { View, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { 
  AccessToken, 
  LoginManager, 
  Settings,
  AuthenticationToken // Import thêm để check login type
} from 'react-native-fbsdk-next';
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
    // Configure Facebook SDK to use CLASSIC login (opens native app)
    // NOT Limited Login (which uses web)
    if (Platform.OS === 'ios') {
      // Enable tracking for better native app experience
      Settings.setAdvertiserTrackingEnabled(true);
      // IMPORTANT: Auto log app events OFF for classic login
      Settings.setAutoLogAppEventsEnabled(false);
    }
    
    // Configure Google Sign-In
    if (GOOGLE_WEB_CLIENT_ID) {
      console.log('🔧 Configuring Google Sign-In with:', {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID
      });
      
      GoogleSignin.configure({ 
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        // Add these for better token retrieval
        scopes: ['profile', 'email'],
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
      // For v16+, use signIn() which returns Promise<User>
      const { type, data: userInfo } = await GoogleSignin.signIn();
      
      console.log('📦 Sign-In type:', type);
      console.log('📦 Full userInfo object:', JSON.stringify(userInfo, null, 2));
      
      if (type === 'cancelled') {
        console.log('User cancelled Google sign-in');
        return;
      }
      
      // Get tokens explicitly after sign in
      let token = userInfo.idToken || userInfo.serverAuthCode;
      
      // If no token in userInfo, try to get tokens explicitly
      if (!token) {
        console.log('⚠️ No token in userInfo, trying getTokens()...');
        try {
          const tokens = await GoogleSignin.getTokens();
          console.log('📦 Tokens from getTokens():', { 
            hasIdToken: !!tokens.idToken,
            hasAccessToken: !!tokens.accessToken 
          });
          token = tokens.idToken || tokens.accessToken;
        } catch (tokenError) {
          console.error('❌ Error getting tokens:', tokenError);
        }
      }
      
      console.log('✅ Google Sign-In successful:', { 
        email: userInfo.user?.email || userInfo.email,
        hasToken: !!token,
        tokenType: token ? 'retrieved' : 'none'
      });
      
      if (!token) {
        console.error('❌ No token found after all attempts');
        throw new Error('No token received from Google');
      }
      
      console.log('📡 Sending OAuth request to backend...');
      const { data } = await authService.socialLogin('google', token);
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
      console.log('Platform:', Platform.OS);
      
      // Test if Facebook SDK is available
      if (!LoginManager || !AccessToken) {
        throw new Error('Facebook SDK not properly initialized');
      }
      
      // CRITICAL: Logout first to reset state
      console.log('Logging out previous session...');
      LoginManager.logOut();
      
      console.log('Requesting Facebook permissions...');
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      console.log('✅ Facebook login result:', {
        isCancelled: result.isCancelled,
        declinedPermissions: result.declinedPermissions,
        grantedPermissions: result.grantedPermissions
      });
      
      if (result.isCancelled) {
        console.log('ℹ️ User cancelled Facebook login');
        return;
      }
      
      if (!result.grantedPermissions || result.grantedPermissions.length === 0) {
        throw new Error('No permissions granted by Facebook');
      }
      
      console.log('✅ Permissions granted:', result.grantedPermissions);
      
      // Get access token
      console.log('Getting access token...');
      const dataToken = await AccessToken.getCurrentAccessToken();
      
      if (!dataToken || !dataToken.accessToken) {
        throw new Error('No access token from Facebook');
      }
      
      console.log('✅ Access token received, length:', dataToken.accessToken.length);
      
      const accessToken = dataToken.accessToken.toString();
      console.log('📡 Sending OAuth request to backend...');
      
      const { data } = await authService.socialLogin('facebook', accessToken);
      console.log('✅ Backend response:', { 
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
      console.error('❌ Facebook OAuth Error:');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Facebook đăng nhập thất bại';
      
      if (error.message?.includes('SDK not properly initialized')) {
        errorMessage = 'Lỗi khởi tạo Facebook SDK. Vui lòng khởi động lại ứng dụng.';
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';
      } else if (error.message?.includes('permissions')) {
        errorMessage = 'Cần cấp quyền để tiếp tục đăng nhập.';
      } else if (error.message?.includes('access token')) {
        errorMessage = 'Không thể lấy thông tin đăng nhập. Vui lòng thử lại.';
      } else if (error.code) {
        errorMessage = `Lỗi Facebook: ${error.code} - ${error.message}`;
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
