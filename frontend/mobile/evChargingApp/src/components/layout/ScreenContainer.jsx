import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';

const ScreenContainer = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 95 : 80, // Tăng padding để tránh bị che
  },
});

export default ScreenContainer;
