import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurface,
    opacity: 0.7,
  }
});

export default function PaymentScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Payment Screen</Text>
      <Text style={styles.subtitle}>Payment for: {route.params?.type}</Text>
    </SafeAreaView>
  );
}
