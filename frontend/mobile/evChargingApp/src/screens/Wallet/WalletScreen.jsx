import { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getWallet, getTransactions } from '../../store/slices/walletSlice'; // To be created

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { color: colors.error, marginBottom: 16 },
  balanceCard: {
    margin: 16,
    backgroundColor: colors.primary,
  },
  balanceLabel: { color: colors.onPrimary, opacity: 0.8 },
  balanceAmount: { color: colors.onPrimary, fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  transactionsSection: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: colors.onSurface },
  transactionCard: { marginBottom: 8, backgroundColor: colors.surface },
  transactionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionType: { fontWeight: 'bold', color: colors.onSurface, textTransform: 'capitalize' },
  transactionDate: { fontSize: 12, color: colors.onSurface, opacity: 0.7 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  seeAllButton: { marginTop: 16 },
  emptyStateText: { color: colors.onSurface, opacity: 0.7, textAlign: 'center' },
});

const WalletScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { profile: user } = useSelector((state) => state.user);
  const { wallet, transactions, loading, error } = useSelector((state) => state.wallet || {});

  const loadWalletData = useCallback(() => {
    const userId = user?.user_id || user?.id;
    if (userId) {
      // Try to get wallet info (may fail if wallet doesn't exist yet)
      dispatch(getWallet(userId)).catch(err => {
        console.log('Wallet not created yet:', err);
      });
      // Get transaction history (this should work even without wallet)
      dispatch(getTransactions({ userId, params: { limit: 5 } }));
    }
  }, [dispatch, user]);

  useFocusEffect(loadWalletData);

  if (loading && !wallet) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
      
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWalletData} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceAmount}>
            {wallet?.balance !== undefined ? wallet.balance.toLocaleString('vi-VN') : '0'} ₫
          </Text>
          {!wallet && (
            <Text style={{ color: colors.onPrimary, opacity: 0.7, fontSize: 12, marginTop: 4 }}>
              Ví chưa được kích hoạt. Nạp tiền để kích hoạt.
            </Text>
          )}
          <View style={styles.actionsContainer}>
            <Button 
              mode="contained" 
              icon="plus-circle" 
              onPress={() => navigation.navigate('TopupScreen')}
              style={{ flex: 1, marginRight: 8 }}
            >
              Nạp tiền
            </Button>
            {/* Withdraw feature not implemented in backend yet */}
            {/* <Button 
              mode="outlined" 
              icon="arrow-down-bold-circle" 
              onPress={() => navigation.navigate('WithdrawScreen')} 
              theme={{ colors: { primary: colors.onPrimary } }}
              style={{ flex: 1, marginLeft: 8 }}
            >
              Rút tiền
            </Button> */}
          </View>
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        {!transactions || transactions.length === 0 ? (
          <Text style={styles.emptyStateText}>Chưa có giao dịch nào.</Text>
        ) : (
          transactions.map(tx => (
            <Card key={tx.id || tx.transaction_id} style={styles.transactionCard}>
              <Card.Content style={styles.transactionContent}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.transactionType}>
                      {tx.type === 'topup' ? 'Nạp tiền' : tx.type === 'payment' ? 'Thanh toán' : tx.type === 'refund' ? 'Hoàn tiền' : tx.type}
                    </Text>
                    {tx.status === 'pending' && (
                      <Text style={{ marginLeft: 8, fontSize: 11, color: colors.warning, backgroundColor: colors.warning + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        Chờ xử lý
                      </Text>
                    )}
                    {tx.status === 'completed' && (
                      <Text style={{ marginLeft: 8, fontSize: 11, color: colors.success, backgroundColor: colors.success + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        Thành công
                      </Text>
                    )}
                  </View>
                  <Text style={styles.transactionDate}>{new Date(tx.created_at).toLocaleString('vi-VN')}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: tx.type === 'topup' || tx.type === 'refund' ? colors.success : colors.error }]}>
                  {tx.type === 'topup' || tx.type === 'refund' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} ₫
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
        <Button style={styles.seeAllButton} onPress={() => navigation.navigate('TransactionHistoryScreen')}>
          Xem tất cả
        </Button>
      </View>
          </ScrollView>
    </SafeAreaView>
  );

};

export default WalletScreen;
