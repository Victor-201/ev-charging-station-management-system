import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { theme } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';
import { useChargingCost } from '../../hooks/useChargingCost';

/**
 * Component hiển thị tóm tắt chi phí sạc
 * Bao gồm tổng chi phí, chi phí hàng tháng, và thống kê
 */
export const ChargingCostSummary = ({ userId = null, months = 12 }) => {
  const { monthlyData, totalCost, loading, error, stats } = useChargingCost(userId, months);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Sắp xếp dữ liệu hàng tháng theo thứ tự
  const sortedMonths = Object.keys(monthlyData).sort();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Total Cost Card */}
      <View style={styles.totalCostCard}>
        <Text style={styles.label}>Tổng Chi Phí Sạc</Text>
        <Text style={styles.totalCostValue}>{formatCurrency(totalCost)}</Text>
        <Text style={styles.subLabel}>Tất cả các phiên sạc</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Trung Bình</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.averageCost)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Cao Nhất</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.maxCost)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Thấp Nhất</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.minCost)}</Text>
        </View>
      </View>

      {/* Monthly Breakdown */}
      {sortedMonths.length > 0 && (
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>Chi Phí Theo Tháng</Text>
          {sortedMonths.map((month) => (
            <View key={month} style={styles.monthlyItem}>
              <Text style={styles.monthLabel}>{month}</Text>
              <Text style={styles.monthCost}>{formatCurrency(monthlyData[month])}</Text>
            </View>
          ))}
        </View>
      )}

      {sortedMonths.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Chưa có dữ liệu chi phí sạc</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  totalCostCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  totalCostValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  monthlySection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  monthCost: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default ChargingCostSummary;

