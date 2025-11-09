import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../../utils/formatters';

const BalancePill = ({ balance, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.container, { backgroundColor: colors.primary }]}>
        <Icon name="wallet" size={16} color={colors.surface} style={styles.icon} />
        <Text style={[styles.balance, { color: colors.surface }]}>
          {formatCurrency(balance)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  icon: {
    marginRight: 4,
  },
  balance: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BalancePill;