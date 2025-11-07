import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getWallet, getTransactions } from '../../store/slices/walletSlice'; // To be created
import { theme } from '../../config/theme';

const WalletScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { wallet, transactions, loading, error } = useSelector((state) => state.wallet || {});

  const loadWalletData = useCallback(() => {
    if (user?.id) {
      dispatch(getWallet(user.id));
      dispatch(getTransactions({ userId: user.id, limit: 5 })); // Fetch recent transactions
    }
  }, [dispatch, user?.id]);

  useFocusEffect(loadWalletData);

  if (loading && !wallet) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadWalletData}>Thử lại</Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWalletData} />}
    >
      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Paragraph style={styles.balanceLabel}>Số dư hiện tại</Paragraph>
          <Title style={styles.balanceAmount}>{wallet?.balance?.toLocaleString('vi-VN') || 0} ₫</Title>
          <View style={styles.actionsContainer}>
            <Button mode="contained" icon="plus-circle" onPress={() => navigation.navigate('TopUp')}>
              Nạp tiền
            </Button>
            <Button mode="outlined" icon="arrow-down-bold-circle" onPress={() => navigation.navigate('Withdraw')}>
              Rút tiền
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Title style={styles.sectionTitle}>Giao dịch gần đây</Title>
        {!transactions || transactions.length === 0 ? (
          <Text>Chưa có giao dịch nào.</Text>
        ) : (
          transactions.map(tx => (
            <Card key={tx.id} style={styles.transactionCard}>
              <Card.Content style={styles.transactionContent}>
                <View>
                  <Text style={styles.transactionType}>{tx.type}</Text>
                  <Text style={styles.transactionDate}>{new Date(tx.created_at).toLocaleString('vi-VN')}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: tx.type === 'topup' ? theme.colors.success : theme.colors.error }]}>
                  {tx.amount.toLocaleString('vi-VN')} ₫
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
        <Button style={styles.seeAllButton} onPress={() => navigation.navigate('TransactionHistory')}>
          Xem tất cả
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.colors.error, marginBottom: 16 },
  balanceCard: {
    margin: 16,
    backgroundColor: theme.colors.primary,
  },
  balanceLabel: { color: theme.colors.onPrimary + 'B3' },
  balanceAmount: { color: theme.colors.onPrimary, fontSize: 36, marginVertical: 8 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  transactionsSection: { padding: 16 },
  sectionTitle: { marginBottom: 16 },
  transactionCard: { marginBottom: 8 },
  transactionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionType: { fontWeight: 'bold' },
  transactionDate: { fontSize: 12, color: theme.colors.onSurface + '80' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  seeAllButton: { marginTop: 16 },
});

export default WalletScreen;
