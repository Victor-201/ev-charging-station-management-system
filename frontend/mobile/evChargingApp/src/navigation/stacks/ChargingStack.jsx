// src/navigation/stacks/ChargingStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../../config/theme';

// Import screens
import ChargingHistoryScreen from '../../screens/Charging/ChargingHistoryScreen';
import ChargingHistoryDetail from '../../screens/Charging/ChargingHistoryDetail';
import ActiveChargingScreen from '../../screens/Charging/ActiveChargingScreen';
import ChargingCompleteScreen from '../../screens/Charging/ChargingCompleteScreen';
import InvoiceScreen from '../../screens/Payment/InvoiceScreen';
import ActiveSessionScreen from '../../screens/Charging/ActiveSessionScreen';
import ChargingSessionDetailScreen from '../../screens/Charging/ChargingSessionDetailScreen';

import InitiateChargingScreen from '../../screens/Charging/InitiateChargingScreen';
const Stack = createNativeStackNavigator();

export default function ChargingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="ChargingHistory"
        component={ChargingHistoryScreen}
        options={{
          title: 'Lịch sử sạc',
        }}
      />
      <Stack.Screen
        name="ChargingHistoryDetail"
        component={ChargingHistoryDetail}
        options={{
          title: 'Chi tiết phiên sạc',
        }}
      />
      <Stack.Screen
        name="ChargingSessionDetail"
        component={ChargingSessionDetailScreen}
        options={{
          title: 'Chi tiết phiên sạc (Realtime)',
        }}
      />
      <Stack.Screen
        name="ActiveCharging"
        component={ActiveChargingScreen}
        options={{
          title: 'Đang sạc',
          headerLeft: () => null, // Prevent going back during active charging
        }}
      />
      <Stack.Screen
        name="ChargingComplete"
        component={ChargingCompleteScreen}
        options={{
          title: 'Hoàn thành',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Invoice"
        component={InvoiceScreen}
        options={{
          title: 'Hóa đơn',
        }}
      />
      <Stack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{
          title: 'Bắt đầu phiên sạc',
          headerLeft: () => null, // Prevent going back
        }}
      />
    </Stack.Navigator>

      <Stack.Screen
        name="InitiateCharging"
        component={InitiateChargingScreen}
        options={{
          headerShown: false,
        }}
      />
  );
}

