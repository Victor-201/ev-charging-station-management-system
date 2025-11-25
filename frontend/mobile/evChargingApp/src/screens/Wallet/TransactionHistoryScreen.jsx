import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getTransactions } from '../../store/slices/walletSlice';
import TransactionCard from '../../components/wallet/TransactionCard';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

const TransactionHistoryScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { transactions, loading, error } = useSelector((state) => state.wallet || {});

  const [filter, setFilter] = useState('all'); // 'all', 'topup', 'payment', 'refund'
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(() => {
    const userId = user?.user_id || user?.id;
    if (userId) {
      const params = filter === 'all' ? {} : { type: filter };
      dispatch(getTransactions({ userId, params }));
    }
  }, [dispatch, user, filter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  // Load transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  // Reload transactions when filter changes
  useEffect(() => {
    loadTransactions();
  }, [filter, loadTransactions]); // Include loadTransactions in deps

  const renderItem = ({ item }) => (
    <TransactionCard
      transaction={item}
      onPress={() => {
        // Navigate to transaction detail if needed
        // navigation.navigate('TransactionDetail', { transactionId: item.id });
      }}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt-long" size={80} color={colors.onSurfaceVariant} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Chưa có giao dịch</Text>
      <Text style={styles.emptySubtext}>
        Lịch sử giao dịch của bạn sẽ hiển thị ở đây
      </Text>
    </View>
  );

  if (loading && !refreshing && (!transactions || transactions.length === 0)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>
            Đang tải lịch sử giao dịch...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && (!transactions || transactions.length === 0)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Icon name="error-outline" size={64} color={colors.error} style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadTransactions}>
            Thử lại
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.filterContainer}>
        <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
          Tất cả
        </Chip>
        <Chip selected={filter === 'topup'} onPress={() => setFilter('topup')}>
          Nạp tiền
        </Chip>
        <Chip selected={filter === 'payment'} onPress={() => setFilter('payment')}>
          Thanh toán
        </Chip>
        <Chip selected={filter === 'refund'} onPress={() => setFilter('refund')}>
          Hoàn tiền
        </Chip>
      </View>

      <FlatList
        data={transactions || []}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item.id || item.transaction_id || index).toString()}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={
          transactions?.length > 0 ? styles.listContainer : { flex: 1 }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;

