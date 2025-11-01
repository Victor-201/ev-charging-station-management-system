// src/components/social/OAuthButtons.jsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { GOOGLE_WEB_CLIENT_ID } from '../../config/env';
import authService from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAccessToken } from '../../store/slices/authSlice';
import { STORAGE_KEYS } from '../../config/constants';

export default function OAuthButtons({ onSuccess, onError }) {
  const dispatch = useDispatch();

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: true });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;
      const { data } = await authService.socialLogin('google', idToken);
      if (data?.accessToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        dispatch(setAccessToken(data.accessToken));
        onSuccess?.(data);
      }
    } catch (error) {
      onError?.(error);
    }
  };

  const signInWithFacebook = async () => {
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) throw new Error('User cancelled Facebook login');
      const dataToken = await AccessToken.getCurrentAccessToken();
      if (!dataToken) throw new Error('No access token from Facebook');
      const accessToken = dataToken.accessToken.toString();
      const { data } = await authService.socialLogin('facebook', accessToken);
      if (data?.accessToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        dispatch(setAccessToken(data.accessToken));
        onSuccess?.(data);
      }
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <View style={{ width: '100%', gap: 8 }}>
      <Button mode="outlined" onPress={signInWithGoogle} uppercase={false} style={{ marginVertical: 6 }}>
        Sign in with Google
      </Button>
      <Button mode="outlined" onPress={signInWithFacebook} uppercase={false} style={{ marginVertical: 6 }}>
        Sign in with Facebook
      </Button>
    </View>
  );
}
