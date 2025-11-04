// src/navigation/stacks/NotificationStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import NotificationList from '../../screens/Notification/NotificationList';
import NotificationDetail from '../../screens/Notification/NotificationDetail';

const Stack = createNativeStackNavigator();

export default function NotificationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NotificationMain" component={NotificationList} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
    </Stack.Navigator>
  );
}