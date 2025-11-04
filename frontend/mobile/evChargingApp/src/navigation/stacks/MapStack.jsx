// src/navigation/stacks/MapStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import MapScreen from '../../screens/Map/MapScreen';
import StationDetail from '../../screens/Map/StationDetail';
import ScheduleBooking from '../../screens/Reservation/ScheduleBooking';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen name="StationDetail" component={StationDetail} />
      <Stack.Screen name="ScheduleBooking" component={ScheduleBooking} />
    </Stack.Navigator>
  );
}