// src/navigation/stacks/PaymentStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import PaymentScreen from '../../screens/Payment/PaymentScreen';
import InvoiceDetail from '../../screens/Payment/InvoiceDetail';
import PaymentConfirmScreen from '../../screens/Payment/PaymentConfirmScreen';
import PaymentStatusScreen from '../../screens/Payment/PaymentStatusScreen';
import PaymentMethodScreen from '../../screens/Payment/PaymentMethodScreen';

const Stack = createNativeStackNavigator();

export default function PaymentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PaymentMain" component={PaymentScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetail} />
      <Stack.Screen name="PaymentConfirmScreen" component={PaymentConfirmScreen} />
      <Stack.Screen name="PaymentMethodScreen" component={PaymentMethodScreen} />
      <Stack.Screen name="PaymentStatusScreen" component={PaymentStatusScreen} />
    </Stack.Navigator>
  );
}