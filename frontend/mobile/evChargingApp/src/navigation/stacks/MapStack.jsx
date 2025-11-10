// src/navigation/stacks/MapStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import MapScreen from '../../screens/Map/MapScreen';
import StationListScreen from '../../screens/Map/StationListScreen';
import StationDetail from '../../screens/Map/StationDetail';
import ScheduleBooking from '../../screens/Reservation/ScheduleBooking';
import ReportIssueScreen from '../../screens/Station/ReportIssueScreen';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen name="StationList" component={StationListScreen} />
      <Stack.Screen name="StationDetail" component={StationDetail} />
      <Stack.Screen name="ScheduleBooking" component={ScheduleBooking} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
    </Stack.Navigator>
  );
}