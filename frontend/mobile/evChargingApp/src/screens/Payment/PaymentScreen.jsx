import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import PaymentHero from '../../components/payment/PaymentHero';
import PaymentQuickActions from '../../components/payment/PaymentQuickActions';
import TransactionItem from '../../components/payment/TransactionItem';
import useWallet from '../../hooks/useWallet';
import useWalletTransactions from '../../hooks/useWalletTransactions';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.onBackground, marginBottom: 12 },
  emptyBox: { padding: 20, borderRadius: 12, alignItems: 'center', backgroundColor: colors.surface },
  emptyText: { color: colors.onSurfaceVariant },
});

export default function PaymentScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const userProfile = useSelector((s) => s.user?.profile) || useSelector((s)=> s.auth?.userProfile);

  // Wallet data
  const { wallet } = useWallet(true, userProfile?.user_id);
  const { transactions, loading: txLoading } = useWalletTransactions({ autoFetch: true, userId: userProfile?.user_id, params: { limit: 10 } });

  const actions = useMemo(() => ([
    { icon: 'cash-plus', label: 'Nạp tiền', color: colors.success, onPress: () => navigation.navigate('Wallet', { screen: 'TopupScreen' }) },
    { icon: 'cash-minus', label: 'Rút tiền', color: colors.error, onPress: () => navigation.navigate('Wallet', { screen: 'WithdrawScreen' }) },
    { icon: 'file-document', label: 'Hóa đơn', color: colors.primary, onPress: () => navigation.navigate('History', { screen: 'ChargingHistory' }) },
    { icon: 'history', label: 'Lịch sử ví', color: colors.brand300 || colors.primary, onPress: () => navigation.navigate('Wallet', { screen: 'TransactionHistoryScreen' }) },
  ]), [colors, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <PaymentHero
          balance={wallet?.balance || 0}
          amountDue={0}
          onTopup={() => navigation.navigate('Wallet', { screen: 'TopupScreen' })}
        />

        <PaymentQuickActions actions={actions} />

        {/* Recent transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
          {txLoading ? (
            <ActivityIndicator />
          ) : (transactions && transactions.length > 0 ? (
            <View>
              {transactions.slice(0, 5).map((tx, idx) => (
                <TransactionItem key={tx.id || tx.transaction_id || idx} tx={tx} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có giao dịch.</Text>
            </View>
          ))}
        </View>

        {/* Spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
