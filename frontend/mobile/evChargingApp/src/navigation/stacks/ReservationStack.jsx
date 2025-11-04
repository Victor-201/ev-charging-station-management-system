// src/navigation/stacks/ReservationStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ReservationList from '../../screens/Reservation/ReservationList';
import ReservationDetail from '../../screens/Reservation/ReservationDetail';
import ScheduleBooking from '../../screens/Reservation/ScheduleBooking';

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
    </Stack.Navigator>
  );
}