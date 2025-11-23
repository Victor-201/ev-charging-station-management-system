// src/navigation/stacks/MainTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';

import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
// Import components
import CustomTabBar from '../../components/layout/CustomTabBar';

// Import screens and stacks
import HomeScreen from '../../screens/Home/HomeScreen';
import MapStack from './MapStack';
import HistoryStack from './HistoryStack';
import WalletStack from './WalletStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'MapMain';
          return {
            title: 'Bản đồ',
            tabBarStyle: { display: routeName === 'MapMain' ? 'flex' : 'none' },
          };
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ChargingHistory';
          return {
            title: 'Lịch sử',
            tabBarStyle: { display: routeName === 'ChargingHistory' ? 'flex' : 'none' },
          };
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'WalletMain';
          return {
            title: 'Ví',
            tabBarStyle: { display: routeName === 'WalletMain' ? 'flex' : 'none' },
          };
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
          return {
            title: 'Hồ sơ',
            tabBarStyle: { display: routeName === 'ProfileMain' ? 'flex' : 'none' },
          };
        }}
      />
    </Tab.Navigator>
  );
}
