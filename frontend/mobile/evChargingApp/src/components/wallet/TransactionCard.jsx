import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Card, IconButton } from 'react-native-paper';

const getStyles = (colors) => StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: colors.onSurface,
  },
  date: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  amountContainer: {
    marginLeft: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const TransactionCard = ({ transaction, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!transaction) return null;

  const {
    type = 'Giao dịch',
    status = 'pending',
    created_at,
    amount = 0,
    description,
    meta,
  } = transaction;

  // Determine if transaction is positive (topup, refund) or negative (payment)
  const isPositive = type === 'topup' || type === 'refund';
  const amountColor = isPositive ? colors.success : colors.error;
  const icon = isPositive ? 'arrow-up-bold-circle' : 'arrow-down-bold-circle';
  const iconColor = isPositive ? colors.success : colors.error;

  // Get description from meta or use type
  const typeLabels = {
    topup: 'Nạp tiền',
    payment: 'Thanh toán',
    refund: 'Hoàn tiền',
    charging: 'Phí sạc xe'
  };
  const statusLabels = {
    pending: 'Chờ xử lý',
    completed: 'Thành công',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn tiền'
  };
  const displayText = meta?.description || description || typeLabels[type] || type;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <IconButton icon={icon} size={32} iconColor={iconColor} style={{ margin: 0 }} />
        </View>
        <View style={styles.details}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.type}>{displayText}</Text>
            {status !== 'completed' && (
              <Text style={{
                marginLeft: 8,
                fontSize: 11,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                color: status === 'pending' ? colors.warning : status === 'failed' ? colors.error : colors.onSurfaceVariant,
                backgroundColor: status === 'pending' ? colors.warning + '20' : status === 'failed' ? colors.error + '20' : colors.surfaceVariant,
              }}>
                {statusLabels[status] || status}
              </Text>
            )}
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isPositive ? '+' : ''}{amount.toLocaleString('vi-VN')} ₫
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default TransactionCard;
