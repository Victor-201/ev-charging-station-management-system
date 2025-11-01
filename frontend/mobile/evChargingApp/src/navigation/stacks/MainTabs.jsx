// src/navigation/stacks/MainTabs.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

function Dummy() {
  return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>Placeholder</Text></View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={Dummy} />
      <Tab.Screen name="Map" component={Dummy} />
    </Tab.Navigator>
  );
}
