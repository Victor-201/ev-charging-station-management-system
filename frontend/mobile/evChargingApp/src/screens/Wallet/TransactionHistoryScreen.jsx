import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getTransactions } from '../../store/slices/walletSlice';
import { theme } from '../../config/theme';

const TransactionHistoryScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { transactions, loading, error } = useSelector((state) => state.wallet);

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
      <Text style={[styles.transactionAmount, { color: item.amount > 0 ? theme.colors.success : theme.colors.error }]}>
        {item.amount.toLocaleString('vi-VN')} ₫
      </Text>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
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
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<View style={styles.centered}><Text>Không có giao dịch nào.</Text></View>}
        onRefresh={loadTransactions}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  errorText: { color: theme.colors.error, marginBottom: 16 },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  transactionType: { fontWeight: 'bold', textTransform: 'capitalize' },
  transactionDate: { fontSize: 12, color: theme.colors.onSurface + '80' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
});

export default TransactionHistoryScreen;

