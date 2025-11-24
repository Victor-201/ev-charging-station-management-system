import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import InfoRow from '../common/InfoRow';

export default function TransactionInfoCard({ transaction }) {
  const { colors } = useTheme();

  const transactionTypeMap = {
    topup: 'Nạp tiền vào ví',
    payment: 'Thanh toán phí sạc',
    refund: 'Hoàn tiền',
    booking_fee: 'Phí đặt chỗ',
    withdraw: 'Rút tiền',
  };

  const statusMap = {
    completed: 'Thành công',
    pending: 'Đang xử lý',
    failed: 'Thất bại',
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.onBackground }]}>Chi tiết giao dịch</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <InfoRow 
          icon="identifier"
          label="Mã giao dịch"
          value={transaction?.id || transaction?.transaction_id}
        />
        <InfoRow 
          icon="clock-outline"
          label="Thời gian"
          value={new Date(transaction?.created_at || Date.now()).toLocaleString('vi-VN')}
        />
        <InfoRow 
          icon="format-list-bulleted-type"
          label="Loại giao dịch"
          value={transactionTypeMap[transaction?.type] || 'Khác'}
        />
        <InfoRow 
          icon="check-circle-outline"
          label="Trạng thái"
          value={statusMap[transaction?.status] || transaction?.status}
          isLast
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
});

