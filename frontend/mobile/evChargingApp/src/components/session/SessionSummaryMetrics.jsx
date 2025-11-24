import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Metric = ({ icon, value, label, color }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.metricBox}>
      <Icon name={icon} size={28} color={color || colors.primary} />
      <Text style={[styles.metricValue, { color: color || colors.primary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
};

export default function SessionSummaryMetrics({ session }) {
  const { colors } = useTheme();
  
  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00:00';
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Metric 
        icon="lightning-bolt" 
        value={`${(session?.energy_consumed || 0).toFixed(2)} kWh`} 
        label="Năng lượng"
        color={colors.primary}
      />
      <View style={[styles.divider, { backgroundColor: colors.outline }]} />
      <Metric 
        icon="timer-outline" 
        value={formatDuration(session?.duration)}
        label="Thời gian"
        color={colors.primary}
      />
      <View style={[styles.divider, { backgroundColor: colors.outline }]} />
      <Metric 
        icon="cash" 
        value={`${(session?.cost || 0).toLocaleString('vi-VN')} ₫`} 
        label="Chi phí"
        color={colors.success}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -40, // Pull it up to overlap the header
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
});

