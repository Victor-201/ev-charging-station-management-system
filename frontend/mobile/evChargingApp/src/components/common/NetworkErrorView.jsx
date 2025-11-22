import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function NetworkErrorView({ title, message, onRetry }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={56} color={colors.onSurfaceVariant} />
      <Text style={styles.title}>{title || 'Không có kết nối'}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Icon name="refresh" size={20} color={colors.onPrimary} />
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { marginTop: 12, fontSize: 18, fontWeight: '700', color: colors.onSurface },
  message: { marginTop: 8, fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' },
  retryButton: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { marginLeft: 8, color: colors.onPrimary, fontWeight: '600' },
});

