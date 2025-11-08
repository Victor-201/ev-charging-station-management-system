// src/navigation/RootNavigator.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AuthStack from './stacks/AuthStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './stacks/MainTabs';
import ChargingStack from './stacks/ChargingStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreSession } from '../store/slices/authSlice';
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
        }
      } catch (e) {
        // ignore
      } finally {
        setReady(true);
      }
    })();
  }, [dispatch]);

  if (!ready) return <Loading />;

  return auth?.accessToken ? <AppStack /> : <AuthStack />;
}
