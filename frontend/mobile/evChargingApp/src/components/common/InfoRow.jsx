import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

const InfoRow = ({ icon, label, value, valueStyle }) => {
  const { colors } = useTheme(); 

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {icon && <Icon name={icon} size={20} color={colors.onSurfaceVariant} />}
        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: colors.onBackground }, valueStyle]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
});

export default InfoRow;