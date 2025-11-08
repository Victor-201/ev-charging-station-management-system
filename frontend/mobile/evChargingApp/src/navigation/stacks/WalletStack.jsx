// src/navigation/stacks/WalletStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import WalletScreen from '../../screens/Wallet/WalletScreen';
import TopupScreen from '../../screens/Wallet/TopupScreen';
import WithdrawScreen from '../../screens/Wallet/WithdrawScreen';
import TransactionHistoryScreen from '../../screens/Wallet/TransactionHistoryScreen';

const Stack = createNativeStackNavigator();

export default function WalletStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="TopupScreen" component={TopupScreen} />
      <Stack.Screen name="WithdrawScreen" component={WithdrawScreen} />
      <Stack.Screen name="TransactionHistoryScreen" component={TransactionHistoryScreen} />
    </Stack.Navigator>
  );
}

