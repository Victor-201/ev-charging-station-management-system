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
    created_at,
    amount = 0,
    description,
  } = transaction;

  const isPositive = amount >= 0;
  const amountColor = isPositive ? colors.success : colors.onSurface;
  const icon = isPositive ? 'arrow-up-bold-circle' : 'arrow-down-bold-circle';
  const iconColor = isPositive ? colors.success : colors.error;

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
          <Text style={styles.type}>{description || type}</Text>
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
