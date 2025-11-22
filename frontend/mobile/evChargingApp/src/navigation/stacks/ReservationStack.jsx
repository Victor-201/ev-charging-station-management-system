// src/navigation/stacks/ReservationStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// New booking screens
import MyBookingsScreen from '../../screens/Booking/MyBookingsScreen';
import BookingConfirmationScreen from '../../screens/Booking/BookingConfirmationScreen';
import SelectChargingPointScreen from '../../screens/Booking/SelectChargingPointScreen';
import SelectTimeSlotScreen from '../../screens/Booking/SelectTimeSlotScreen';
import InitiateChargingScreen from '../../screens/Charging/InitiateChargingScreen';

const Stack = createNativeStackNavigator();

export default function ReservationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MyBookingsScreen" component={MyBookingsScreen} />
      <Stack.Screen name="SelectChargingPointScreen" component={SelectChargingPointScreen} />
      <Stack.Screen name="SelectTimeSlotScreen" component={SelectTimeSlotScreen} />
      <Stack.Screen name="BookingConfirmationScreen" component={BookingConfirmationScreen} />
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