// src/navigation/stacks/HistoryStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ChargingHistoryScreen from '../../screens/History/ChargingHistoryScreen';
import SessionDetailScreen from '../../screens/History/SessionDetailScreen';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ChargingHistory" component={ChargingHistoryScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}

