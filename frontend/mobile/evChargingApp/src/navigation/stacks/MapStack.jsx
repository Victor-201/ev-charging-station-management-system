// src/navigation/stacks/MapStack.jsx
import { Platform } from 'react-native';
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

/**
 * iOS-optimized navigation stack with modal presentations
 * - Modal sheets for contextual tasks (time slot selection, issue reporting)
 * - Smooth transitions between map and station details
 * - Native iOS animations and gestures
 */
export default function MapStack() {
  const isIOS = Platform.OS === 'ios';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // iOS-specific smooth animations
        animation: isIOS ? 'default' : 'slide_from_right',
      }}
    >
      {/* Main map screen */}
      <Stack.Screen
        name="MapMain"
        component={MapScreen}
      />

      {/* Station list - standard push */}
      <Stack.Screen
        name="StationListScreen"
        component={StationListScreen}
      />

      {/* Station detail - smooth transition from map */}
      <Stack.Screen
        name="StationDetailScreen"
        component={StationDetailScreen}
        options={{
          animation: isIOS ? 'slide_from_right' : 'default',
          // Enable shared element transition on iOS
          presentation: isIOS ? 'card' : 'push',
        }}
      />

      {/* Charging point selection - standard push */}
      <Stack.Screen
        name="SelectChargingPointScreen"
        component={SelectChargingPointScreen}
      />

      {/* Time slot selection - modal sheet for contextual task */}
      <Stack.Screen
        name="SelectTimeSlotScreen"
        component={SelectTimeSlotScreen}
        options={{
          presentation: isIOS ? 'formSheet' : 'modal',
          animation: isIOS ? 'slide_from_bottom' : 'default',
          gestureEnabled: true,
        }}
      />

      {/* Booking confirmation - standard push */}
      <Stack.Screen
        name="BookingConfirmationScreen"
        component={BookingConfirmationScreen}
      />

      {/* My bookings - standard push */}
      <Stack.Screen
        name="MyBookingsScreen"
        component={MyBookingsScreen}
      />

      {/* Report issue - modal sheet for contextual task */}
      <Stack.Screen
        name="ReportIssue"
        component={ReportIssueScreen}
        options={{
          presentation: isIOS ? 'formSheet' : 'modal',
          animation: isIOS ? 'slide_from_bottom' : 'default',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}