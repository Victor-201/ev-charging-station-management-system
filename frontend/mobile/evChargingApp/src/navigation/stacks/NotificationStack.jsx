// src/navigation/stacks/NotificationStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import NotificationListScreen from '../../screens/Notification/NotificationListScreen';
import NotificationDetail from '../../screens/Notification/NotificationDetail';

const Stack = createNativeStackNavigator();

export default function NotificationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NotificationMain" component={NotificationListScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
    </Stack.Navigator>
  );
}