import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, Divider, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getInvoice } from '../../store/slices/paymentSlice';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, color: colors.onPrimary, opacity: 0.8 },
  headerAmount: { fontSize: 40, fontWeight: 'bold', color: colors.onPrimary, marginVertical: 8 },
  headerStatus: { fontSize: 14, color: colors.onPrimary, fontWeight: '500' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.onSurface, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: colors.onSurface, opacity: 0.7 },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  stationName: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  stationAddress: { fontSize: 13, color: colors.onSurface, opacity: 0.6 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.outline },
});



const DetailRow = ({ label, value, valueStyle }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
};

export default function InvoiceDetail({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { id } = route.params;
  const { invoice, loading, error } = useSelector((state) => state.payment);

  useEffect(() => {
    if (id) {
      dispatch(getInvoice(id));
    }
  }, [id, dispatch]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Đang tải hóa đơn...</Text>
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.error, marginBottom: 16 }}>{error || 'Không thể tải được chi tiết hóa đơn.'}</Text>
        <Button mode="contained" onPress={() => dispatch(getInvoice(id))}>Thử lại</Button>
      </SafeAreaView>
    );
  }

  const subtotal = (invoice.amount || 0) - (invoice.tax || 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tổng thanh toán</Text>
        <Text style={styles.headerAmount}>{invoice.amount.toLocaleString('vi-VN')} {invoice.currency}</Text>
        <Text style={styles.headerStatus}>Trạng thái: {invoice.status === 'completed' ? 'Thành công' : 'Khác'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết trạm sạc</Text>
          <Text style={styles.stationName}>{invoice.station_name}</Text>
          <Text style={styles.stationAddress}>{invoice.station_address}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết giao dịch</Text>
          <DetailRow label="Mã giao dịch" value={`#${invoice.transaction_id}`} />
          <DetailRow label="Thời gian" value={new Date(invoice.created_at).toLocaleString('vi-VN')} />
          <DetailRow label="Thời gian sạc" value={invoice.duration} />
          <DetailRow label="Phương thức" value={invoice.payment_method} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết hóa đơn</Text>
          <DetailRow label="Năng lượng tiêu thụ" value={`${invoice.energy_consumed} kWh`} />
          <DetailRow label="Đơn giá" value={`${invoice.price_per_kwh.toLocaleString('vi-VN')} đ/kWh`} />
          <Divider style={{ marginVertical: 8 }} />
          <DetailRow label="Tạm tính" value={`${subtotal.toLocaleString('vi-VN')} đ`} />
          <DetailRow label="Thuế (VAT 8%)" value={`${invoice.tax.toLocaleString('vi-VN')} đ`} />
          <DetailRow label="Tổng cộng" value={`${invoice.amount.toLocaleString('vi-VN')} đ`} valueStyle={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button icon="download" mode="contained" onPress={() => { /* TODO */ }}>Tải hóa đơn (PDF)</Button>
        <Button style={{ marginTop: 12 }} onPress={() => navigation.goBack()}>Quay lại</Button>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
