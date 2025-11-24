import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useTheme, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import TransactionInfoCard from '../../components/wallet/TransactionInfoCard';

const getStyles = (colors, isPositive) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // Header
  header: {
    backgroundColor: isPositive ? colors.primary : colors.error,
    paddingTop: Platform.OS === 'android' ? 24 : 60,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', flex: 1 },
  amountContainer: { alignItems: 'center', marginTop: 16 },
  amount: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  status: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4, textTransform: 'capitalize' },
  // Body
  content: { marginTop: -32 }, // Pull up content to overlap header
  actionsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.outline },
});

export default function TransactionDetailScreen({ route, navigation }) {
  const { transaction } = route.params || {};
  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Không có thông tin giao dịch.</Text>
      </SafeAreaView>
    );
  }

  const isPositive = (transaction?.type === 'topup' || transaction?.type === 'refund');
  const { colors } = useTheme();
  const styles = getStyles(colors, isPositive);

  const formattedAmount = `${isPositive ? '+' : ''}${Number(transaction?.amount || 0).toLocaleString('vi-VN')} ₫`;
  const statusText = transaction?.status === 'completed' ? 'Thành công' : 'Đang xử lý';

  const handleViewSession = () => {
    if (transaction?.metadata?.session_id) {
      navigation.navigate('History', {
        screen: 'SessionDetail',
        params: { sessionId: transaction.metadata.session_id },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Icon name="arrow-left" size={24} color="#fff" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Chi tiết giao dịch</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formattedAmount}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </View>
      </View>

      <ScrollView>
        <View style={styles.content}>
          <TransactionInfoCard transaction={transaction} />

          {transaction?.description && (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.onBackground }}>Ghi chú</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
                <Text style={{ color: colors.onSurfaceVariant }}>{transaction.description}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
        {transaction?.type === 'payment' && transaction?.metadata?.session_id && (
          <Button
            icon="history"
            mode="contained"
            style={{ marginBottom: 8 }}
            onPress={handleViewSession}
          >
            Xem phiên sạc
          </Button>
        )}
        <Button
          icon="help-circle-outline"
          mode="outlined"
          onPress={() => { /* Navigate to support */ }}
        >
          Cần hỗ trợ?
        </Button>
      </View>
    </SafeAreaView>
  );
}
