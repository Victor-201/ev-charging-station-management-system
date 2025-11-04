import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NotificationDetail({ navigation, route }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Detail</Text>
      <Text>Notification ID: {route.params?.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
