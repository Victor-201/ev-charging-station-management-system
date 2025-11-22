// src/navigation/stacks/MapStack.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import MapScreen from '../../screens/Map/MapScreen';
import StationListScreen from '../../screens/Station/StationListScreen';
import StationDetailScreen from '../../screens/Station/StationDetailScreen';
import SelectChargingPointScreen from '../../screens/Booking/SelectChargingPointScreen';
import SelectTimeSlotScreen from '../../screens/Booking/SelectTimeSlotScreen';
import BookingConfirmationScreen from '../../screens/Booking/BookingConfirmationScreen';
import MyBookingsScreen from '../../screens/Booking/MyBookingsScreen';
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
      <Stack.Screen name="StationListScreen" component={StationListScreen} />
      <Stack.Screen name="StationDetailScreen" component={StationDetailScreen} />
      <Stack.Screen name="SelectChargingPointScreen" component={SelectChargingPointScreen} />
      <Stack.Screen name="SelectTimeSlotScreen" component={SelectTimeSlotScreen} />
      <Stack.Screen name="BookingConfirmationScreen" component={BookingConfirmationScreen} />
      <Stack.Screen name="MyBookingsScreen" component={MyBookingsScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
    </Stack.Navigator>
  );
}