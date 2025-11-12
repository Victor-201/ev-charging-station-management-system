// src/navigation/stacks/ReservationStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ReservationList from '../../screens/Reservation/ReservationList';
import ReservationDetail from '../../screens/Reservation/ReservationDetail';
import ScheduleBooking from '../../screens/Reservation/ScheduleBooking';
import QRCodeScreen from '../../screens/Reservation/QRCodeScreen';
import InitiateChargingScreen from '../../screens/Charging/InitiateChargingScreen';

const Stack = createNativeStackNavigator();

export default function ReservationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ReservationMain" component={ReservationList} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetail} />
      <Stack.Screen name="ScheduleBooking" component={ScheduleBooking} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} />
      <Stack.Screen
        name="InitiateCharging"
        component={InitiateChargingScreen}
        options={{
          headerShown: true,
          title: 'Bắt đầu sạc',
        }}
      />
    </Stack.Navigator>
  );
}