// src/components/common/ErrorView.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ErrorView({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message || 'Có lỗi xảy ra'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { padding: 16, alignItems: 'center' }, text: { color: 'red' } });
