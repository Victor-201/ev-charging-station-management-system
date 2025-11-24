import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TransactionItem({ tx }) {
  const { colors } = useTheme();
  if (!tx) return null;

  const isTopup = (tx.type || tx.transaction_type) === 'topup' || (tx.amount > 0 && (tx.direction === 'in'));
  const amount = Math.abs(Number(tx.amount || tx.total_amount) || 0);
  const title = isTopup ? 'Nạp tiền' : 'Thanh toán';
  const icon = isTopup ? 'cash-plus' : 'cash-minus';
  const iconColor = isTopup ? colors.primary : colors.error;
  const iconBg = (iconColor) + '20';
  const time = new Date(tx.created_at || tx.timestamp || tx.date).toLocaleString('vi-VN');

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>      
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}> 
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{time}</Text>
      </View>
      <Text style={[styles.amount, { color: isTopup ? colors.primary : colors.error }]}>
        {`${isTopup ? '+' : '-'}${amount.toLocaleString('vi-VN')} ₫`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  center: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12 },
  amount: { fontSize: 16, fontWeight: '700' },
});

