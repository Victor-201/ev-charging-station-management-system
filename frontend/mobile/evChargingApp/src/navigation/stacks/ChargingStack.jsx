// src/navigation/stacks/ChargingStack.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../../config/theme';

// Import screens
import ActiveChargingScreen from '../../screens/Charging/ActiveChargingScreen';
import ChargingCompleteScreen from '../../screens/Charging/ChargingCompleteScreen';
import InvoiceScreen from '../../screens/Payment/InvoiceScreen';
import ActiveSessionScreen from '../../screens/Charging/ActiveSessionScreen';
import InitiateChargingScreen from '../../screens/Charging/InitiateChargingScreen';

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
      <Stack.Screen name="Invoice" component={InvoiceScreen} />
      <Stack.Screen
        name="ActiveSession"
        component={ActiveSessionScreen}
        options={{
          headerShown: true,
          title: 'Bắt đầu phiên sạc',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
        }}
      />
      <Stack.Screen name="InitiateCharging" component={InitiateChargingScreen} />
    </Stack.Navigator>
  );
}

