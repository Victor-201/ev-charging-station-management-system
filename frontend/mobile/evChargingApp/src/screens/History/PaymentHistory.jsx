import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 16,
    backgroundColor: colors.brand50,
    padding: 12,
    borderRadius: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: colors.onSurface,
    opacity: 0.7,
    marginTop: 8,
  },
});

// Mock Data
const mockPayments = [
  {
    id: 'p1',
    station_name: 'Trạm sạc Vincom Đồng Khởi',
    date: '2023-10-26',
    amount: 75000,
    method: 'Credit Card',
  },
  {
    id: 'p2',
    station_name: 'Trạm sạc Landmark 81',
    date: '2023-10-24',
    amount: 120000,
    method: 'MoMo',
  },
  {
    id: 'p3',
    station_name: 'Trạm sạc Central Park',
    date: '2023-10-20',
    amount: 95000,
    method: 'Credit Card',
  },
];

const PaymentHistory = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [payments] = useState(mockPayments);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you would refetch data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderItem = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.iconContainer}>
        <Icon name="receipt-long" size={24} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.stationName} numberOfLines={1}>{item.station_name}</Text>
          <Text style={styles.amount}>{item.amount.toLocaleString()} VND</Text>
        </View>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {payments.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="history" size={48} color={colors.onSurface} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyText}>Chưa có lịch sử thanh toán.</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
};

export default PaymentHistory;
