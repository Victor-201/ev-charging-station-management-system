import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.outline, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginLeft: 16 },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  lastRow: { borderBottomWidth: 0 },
  label: { color: colors.onSurfaceVariant, fontSize: 15 },
  value: { color: colors.onSurface, fontSize: 15, fontWeight: '600', maxWidth: '70%' },
  amount: (isPositive) => ({
    fontSize: 32, fontWeight: 'bold',
    color: isPositive ? colors.success : colors.error,
    textAlign: 'center',
    marginVertical: 24,
  }),
});

const DetailRow = ({ label, value, isLast = false, valueStyle }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={[styles.row, isLast && styles.lastRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]} numberOfLines={1}>{value}</Text>
    </View>
  );
};

export default function TransactionDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { transaction } = route.params || {};

  const isPositive = transaction?.amount > 0;
  const formattedAmount = `${isPositive ? '+' : ''}${Number(transaction?.amount || 0).toLocaleString('vi-VN')} ₫`;

  const transactionTypeMap = {
    deposit: 'Nạp tiền vào ví',
    payment: 'Thanh toán phí sạc',
    refund: 'Hoàn tiền',
    booking_fee: 'Phí đặt chỗ',
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Icon name="arrow-back" size={24} color={colors.onSurface} onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Chi tiết giao dịch</Text>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.amount(isPositive)}>{formattedAmount}</Text>

          <View style={styles.section}>
            <DetailRow label="Mã giao dịch" value={transaction?.id || transaction?.transaction_id} />
            <DetailRow label="Thời gian" value={new Date(transaction?.created_at || Date.now()).toLocaleString('vi-VN')} />
            <DetailRow label="Loại giao dịch" value={transactionTypeMap[transaction?.type] || 'Khác'} />
            <DetailRow label="Trạng thái" value={transaction?.status === 'completed' ? 'Thành công' : 'Đang xử lý'} isLast />
          </View>

          {transaction?.description && (
            <View style={styles.section}>
              <DetailRow label="Mô tả" value={transaction.description} isLast />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
