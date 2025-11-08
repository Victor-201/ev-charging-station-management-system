// src/navigation/stacks/PaymentStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import PaymentHistory from '../../screens/Payment/PaymentHistory';
import PaymentScreen from '../../screens/Payment/PaymentScreen';
import InvoiceDetail from '../../screens/Payment/InvoiceDetail';
import PaymentConfirmScreen from '../../screens/Payment/PaymentConfirmScreen';
import PaymentStatusScreen from '../../screens/Payment/PaymentStatusScreen';

const Stack = createNativeStackNavigator();

export default function PaymentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PaymentMain" component={PaymentHistory} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetail} />
      <Stack.Screen name="PaymentConfirmScreen" component={PaymentConfirmScreen} />
      <Stack.Screen name="PaymentStatusScreen" component={PaymentStatusScreen} />
    </Stack.Navigator>
  );
}