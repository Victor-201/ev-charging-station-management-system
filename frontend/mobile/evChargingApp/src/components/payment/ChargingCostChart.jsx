import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { theme } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';
import { useChargingCost } from '../../hooks/useChargingCost';

const screenWidth = Dimensions.get('window').width;

/**
 * Component hiển thị biểu đồ chi phí sạc hàng tháng
 * Sử dụng simple bar chart visualization
 */
export const ChargingCostChart = ({ userId = null, months = 12 }) => {
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

  const sortedMonths = Object.keys(monthlyData).sort();
  const maxValue = stats.maxCost || 1;
  const barWidth = (screenWidth - 32) / Math.max(sortedMonths.length, 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chi Phí Sạc Hàng Tháng</Text>
        <Text style={styles.totalText}>{formatCurrency(totalCost)}</Text>
      </View>

      {/* Chart */}
      {sortedMonths.length > 0 ? (
        <View style={styles.chartContainer}>
          <View style={styles.barsContainer}>
            {sortedMonths.map((month, index) => {
              const cost = monthlyData[month];
              const barHeight = (cost / maxValue) * 150;
              return (
                <View key={month} style={[styles.barWrapper, { width: barWidth }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 5),
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{month.slice(-2)}</Text>
                  <Text style={styles.barValue}>{formatCurrency(cost)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Chưa có dữ liệu chi phí sạc</Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Trung bình: {formatCurrency(stats.averageCost)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  chartContainer: {
    marginVertical: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 200,
    marginBottom: 8,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 200,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  legend: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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

export default ChargingCostChart;

