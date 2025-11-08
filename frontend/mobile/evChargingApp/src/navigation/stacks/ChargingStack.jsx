// src/navigation/stacks/ChargingStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ActiveChargingScreen from '../../screens/Charging/ActiveChargingScreen';
import ChargingCompleteScreen from '../../screens/Charging/ChargingCompleteScreen';

const Stack = createNativeStackNavigator();

export default function ChargingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ActiveCharging" component={ActiveChargingScreen} />
      <Stack.Screen name="ChargingComplete" component={ChargingCompleteScreen} />
    </Stack.Navigator>
  );
}

