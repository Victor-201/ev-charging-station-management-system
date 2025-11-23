// src/navigation/RootNavigator.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AuthStack from './stacks/AuthStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './stacks/MainTabs';
import ChargingStack from './stacks/ChargingStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreSession } from '../store/slices/authSlice';
import { getMe } from '../store/slices/userSlice';
import { STORAGE_KEYS } from '../config/constants';
import Loading from '../components/common/Loading';
import notificationService from '../services/notificationService';
import NotificationStack from './stacks/NotificationStack';

const RootStack = createNativeStackNavigator();

const AppStack = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Main" component={MainTabs} />
    <RootStack.Screen
      name="Charging"
      component={ChargingStack}
      options={{ presentation: 'modal' }}
    />
    <RootStack.Screen
      name="Notification"
      component={NotificationStack}
      options={{ presentation: 'modal' }}
    />
  </RootStack.Navigator>
);

export default function RootNavigator() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (accessToken && refreshToken) {
          dispatch(restoreSession({ accessToken, refreshToken }));
          // Fetch user profile after restoring session
          await dispatch(getMe());
        }
      } catch (e) {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, [dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 RootNavigator - Auth state:', {
      hasAccessToken: !!auth?.accessToken,
      hasUser: !!auth?.user,
      userProfile: auth?.userProfile,
      user: auth?.user,
      ready,
    });
  }, [auth, ready]);

  // Initialize FCM after login
  useEffect(() => {
    let cleanup;
    if (auth?.accessToken) {
      (async () => {
        try {
          cleanup = await notificationService.initForLoggedInUser();
        } catch (e) {
          console.warn('FCM init failed:', e?.message || e);
        }
      })();
    }
    return () => { if (cleanup) cleanup(); };
  }, [auth?.accessToken]);

  if (!ready) return <Loading />;

  return auth?.accessToken ? <AppStack /> : <AuthStack />;
}
