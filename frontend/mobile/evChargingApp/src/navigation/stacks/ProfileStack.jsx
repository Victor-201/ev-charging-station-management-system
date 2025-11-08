// src/navigation/stacks/ProfileStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import EditProfile from '../../screens/Profile/EditProfile';
import VehicleListScreen from '../../screens/Profile/VehicleListScreen';
import AddVehicleScreen from '../../screens/Profile/AddVehicleScreen';
import EditVehicleScreen from '../../screens/Profile/EditVehicleScreen';
import ChangePasswordScreen from '../../screens/Profile/ChangePasswordScreen';
import AccountSettingsScreen from '../../screens/Profile/AccountSettingsScreen';
import ReservationStack from './ReservationStack';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="VehicleListScreen" component={VehicleListScreen} />
      <Stack.Screen name="AddVehicleScreen" component={AddVehicleScreen} />
      <Stack.Screen name="EditVehicleScreen" component={EditVehicleScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="AccountSettingsScreen" component={AccountSettingsScreen} />
      <Stack.Screen name="ReservationStack" component={ReservationStack} />
    </Stack.Navigator>
  );
}

