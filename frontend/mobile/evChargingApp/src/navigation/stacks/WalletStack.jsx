// src/navigation/stacks/WalletStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import WalletScreen from '../../screens/Wallet/WalletScreen';
import TopupScreen from '../../screens/Wallet/TopupScreen';
import WithdrawScreen from '../../screens/Wallet/WithdrawScreen';
import TransactionHistoryScreen from '../../screens/Wallet/TransactionHistoryScreen';
import SepayTopUpScreen from '../../screens/Payment/SepayTopUpScreen';
import SepayQRCodeScreen from '../../screens/Payment/SepayQRCodeScreen';
import TopupSuccessScreen from '../../screens/Wallet/TopupSuccessScreen';
import TransactionDetailScreen from '../../screens/Wallet/TransactionDetailScreen';

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
      <Stack.Screen name="SepayTopUp" component={SepayTopUpScreen} />
      <Stack.Screen name="SepayQRCode" component={SepayQRCodeScreen} />
      <Stack.Screen name="TopupSuccessScreen" component={TopupSuccessScreen} />
      <Stack.Screen name="TransactionDetailScreen" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}

