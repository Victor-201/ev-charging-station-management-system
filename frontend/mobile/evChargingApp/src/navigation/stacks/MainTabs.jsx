// src/navigation/stacks/MainTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';

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
        options={{ title: 'Bản đồ' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{ title: 'Lịch sử' }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletStack}
        options={{ title: 'Ví' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}
