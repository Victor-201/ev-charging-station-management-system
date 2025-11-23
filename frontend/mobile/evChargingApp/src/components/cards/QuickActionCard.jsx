import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function QuickActionCard({ title, subtitle, onPress, badgeCount }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurface }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {typeof badgeCount === 'number' && badgeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
