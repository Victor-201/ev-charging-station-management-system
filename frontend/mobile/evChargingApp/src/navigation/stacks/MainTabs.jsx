// src/navigation/stacks/MainTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens and stacks
import HomeScreen from '../../screens/Home/HomeScreen';
import MapStack from './MapStack';
import ReservationStack from './ReservationStack';
import PaymentStack from './PaymentStack';
import NotificationStack from './NotificationStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Map') {
            iconName = 'map';
          } else if (route.name === 'Reservation') {
            iconName = 'event';
          } else if (route.name === 'Payment') {
            iconName = 'payment';
          } else if (route.name === 'Notification') {
            iconName = 'notifications';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
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
        name="Reservation" 
        component={ReservationStack}
        options={{ title: 'Đặt chỗ' }}
      />
      <Tab.Screen 
        name="Payment" 
        component={PaymentStack}
        options={{ title: 'Thanh toán' }}
      />
      <Tab.Screen 
        name="Notification" 
        component={NotificationStack}
        options={{ title: 'Thông báo' }}
      />
    </Tab.Navigator>
  );
}
