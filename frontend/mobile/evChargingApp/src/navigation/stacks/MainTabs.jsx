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
        options={({ route }) => ({
          title: 'Bản đồ',
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? ''
            if (['StationDetailScreen', 'SelectChargingPointScreen', 'SelectTimeSlotScreen', 'BookingConfirmationScreen', 'ReportIssue'].includes(routeName)) {
              return { display: 'none' }
            }
            return
          })(route),
        })}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={({ route }) => ({
          title: 'Lịch sử',
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? ''
            if (['SessionDetail'].includes(routeName)) {
              return { display: 'none' }
            }
            return
          })(route),
        })}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletStack}
        options={({ route }) => ({
          title: 'Ví',
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? ''
            if (['TopupSuccessScreen', 'TransactionDetailScreen'].includes(routeName)) {
              return { display: 'none' }
            }
            return
          })(route),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}
