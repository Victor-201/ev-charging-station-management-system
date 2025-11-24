import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function InvoiceHeader({ invoice, onBack }) {
  const { colors } = useTheme();
  const isPaid = invoice?.payment_status === 'paid';
  const headerColor = isPaid ? colors.success : colors.warning;

  return (
    <View style={[styles.header, { backgroundColor: headerColor }]}>
      <View style={styles.headerNav}>
        <Icon name="arrow-left" size={24} color="#fff" onPress={onBack} />
        <Text style={styles.title}>Hóa đơn thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{(invoice?.total_amount || 0).toLocaleString('vi-VN')} ₫</Text>
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Icon name={isPaid ? 'check-circle' : 'alert-circle'} size={14} color="#fff" />
          <Text style={styles.statusText}>{isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? 24 : 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', flex: 1 },
  amountContainer: { alignItems: 'center', marginTop: 16 },
  amount: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
});

