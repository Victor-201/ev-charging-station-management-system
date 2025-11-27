import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { theme } from '../../config/theme';
import { useChargingCost } from '../../hooks/useChargingCost';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

/**
 * Screen hiển thị chi tiết chi phí sạc của người dùng
 */
export const ChargingCostScreen = ({ route }) => {
  const { user } = useAuth();
  const userId = route?.params?.userId || user?.id || user?.user_id;
  const [months, setMonths] = useState(12);
  const [refreshing, setRefreshing] = useState(false);
  
  const { monthlyData, totalCost, loading, error, stats, refetch } = useChargingCost(userId, months);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const sortedMonths = Object.keys(monthlyData).sort();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chi Phí Sạc</Text>
        <Text style={styles.subtitle}>Theo dõi chi phí sạc của bạn</Text>
      </View>

      {/* Total Cost Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Tổng Chi Phí</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalCost)}</Text>
        <Text style={styles.totalSubtext}>Trong {months} tháng gần nhất</Text>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        {[3, 6, 12].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.monthButton, months === m && styles.monthButtonActive]}
            onPress={() => setMonths(m)}
          >
            <Text style={[styles.monthButtonText, months === m && styles.monthButtonTextActive]}>
              {m}M
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Trung Bình</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.averageCost)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cao Nhất</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.maxCost)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Thấp Nhất</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.minCost)}</Text>
        </View>
      </View>

      {/* Monthly List */}
      {sortedMonths.length > 0 && (
        <View style={styles.monthlyList}>
          <Text style={styles.listTitle}>Chi Tiết Theo Tháng</Text>
          {sortedMonths.map((month) => (
            <View key={month} style={styles.monthlyRow}>
              <Text style={styles.monthName}>{month}</Text>
              <Text style={styles.monthlyCost}>{formatCurrency(monthlyData[month])}</Text>
            </View>
          ))}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  totalCard: {
    margin: 16,
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginVertical: 8,
  },
  totalSubtext: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.7,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  monthButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  monthButtonTextActive: {
    color: theme.colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
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
  monthlyList: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthName: {
    fontSize: 14,
    color: theme.colors.text,
  },
  monthlyCost: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    padding: 16,
  },
});

export default ChargingCostScreen;

