import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getTransactions } from '../../store/slices/walletSlice';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  errorText: { color: colors.error, marginBottom: 16 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: colors.surface,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  transactionType: { fontWeight: 'bold', textTransform: 'capitalize', color: colors.onSurface },
  transactionDate: { fontSize: 12, color: colors.onSurface, opacity: 0.7 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: colors.onSurface, opacity: 0.7 },
});

const TransactionHistoryScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { transactions, loading, error } = useSelector((state) => state.wallet || {});

  const [filter, setFilter] = useState('all'); // 'all', 'topup', 'payment', 'refund'

  const loadTransactions = useCallback(() => {
    if (user?.id) {
      const params = filter === 'all' ? {} : { type: filter };
      dispatch(getTransactions({ userId: user.id, params }));
    }
  }, [dispatch, user?.id, filter]);

  useFocusEffect(loadTransactions);

  const renderItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View>
        <Text style={styles.transactionType}>{item.type}</Text>
        <Text style={styles.transactionDate}>{new Date(item.created_at).toLocaleString('vi-VN')}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.amount > 0 ? colors.success : colors.error }]}>
        {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('vi-VN')} ₫
      </Text>
    </View>
  );

  if (loading && !transactions) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadTransactions}>Thử lại</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>Tất cả</Chip>
        <Chip selected={filter === 'topup'} onPress={() => setFilter('topup')}>Nạp tiền</Chip>
        <Chip selected={filter === 'payment'} onPress={() => setFilter('payment')}>Thanh toán</Chip>
        <Chip selected={filter === 'refund'} onPress={() => setFilter('refund')}>Hoàn tiền</Chip>
      </View>

      <FlatList
        data={transactions || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>Không có giao dịch nào.</Text></View>}
        onRefresh={loadTransactions}
        refreshing={loading}
        contentContainerStyle={transactions?.length > 0 ? {} : styles.centered}
      />
    </View>
  );
};

export default TransactionHistoryScreen;

