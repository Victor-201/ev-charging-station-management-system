import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { theme } from '../../config/theme';

export default function AuthWrapper({ children }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.form}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
});
