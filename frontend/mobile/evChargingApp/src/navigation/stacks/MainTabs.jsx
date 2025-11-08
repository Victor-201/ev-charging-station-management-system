// src/navigation/stacks/MainTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Map') {
            iconName = 'map';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else if (route.name === 'Wallet') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
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
