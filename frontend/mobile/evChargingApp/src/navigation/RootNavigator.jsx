// src/navigation/RootNavigator.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AuthStack from './stacks/AuthStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './stacks/MainTabs';
import ChargingStack from './stacks/ChargingStack';
import CompleteProfile from '../screens/Auth/CompleteProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreSession, fetchUserProfile, setIsNewUser } from '../store/slices/authSlice';
import { STORAGE_KEYS } from '../config/constants';
import Loading from '../components/common/Loading';

const RootStack = createNativeStackNavigator();

const AppStack = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Main" component={MainTabs} />
    <RootStack.Screen
      name="Charging"
      component={ChargingStack}
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
          const profileResult = await dispatch(fetchUserProfile());

          // Check if profile is incomplete (no full_name)
          if (profileResult.payload && !profileResult.payload.full_name) {
            dispatch(setIsNewUser(true));
          }
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
      isNewUser: auth?.isNewUser,
      userProfile: auth?.userProfile,
      user: auth?.user,
      ready
    });
  }, [auth, ready]);

  if (!ready) return <Loading />;

  // If user is authenticated but needs to complete profile
  if (auth?.accessToken && auth?.isNewUser) {
    return <CompleteProfile />;
  }

  return auth?.accessToken ? <AppStack /> : <AuthStack />;
}
