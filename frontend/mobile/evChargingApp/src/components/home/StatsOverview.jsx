import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StatItem = ({ icon, value, label, trend, iconColor, iconBg }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg || colors.primaryContainer }]}>
        <Icon name={icon} size={24} color={iconColor || colors.primary} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.onBackground }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
          {label}
        </Text>
        {trend && (
          <View style={styles.trendContainer}>
            <Icon 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend > 0 ? '#86df20' : '#f60d01'} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? '#86df20' : '#f60d01' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function StatsOverview({ stats }) {
  const { colors } = useTheme();

  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
        Thống kê của bạn
      </Text>
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <StatItem key={index} {...stat} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

