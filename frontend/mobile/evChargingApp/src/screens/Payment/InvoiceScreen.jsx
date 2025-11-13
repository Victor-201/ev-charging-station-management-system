import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import useCharging from '../../hooks/useCharging';
import InfoRow from '../../components/common/InfoRow';

const InvoiceScreen = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId } = route.params || {};
  const { invoice, invoiceLoading, fetchInvoice } = useCharging();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (sessionId && !invoice) {
      fetchInvoice(sessionId);
    }
  }, [sessionId, invoice, fetchInvoice]);

  const handleShare = async () => {
    if (!invoice) return;

    try {
      const message = `
Hóa đơn sạc xe điện
━━━━━━━━━━━━━━━━━━━━
Mã hóa đơn: ${invoice.invoice_number || invoice.id}
Trạm sạc: ${invoice.station_name}
Ngày: ${new Date(invoice.created_at).toLocaleDateString('vi-VN')}

Chi tiết:
- Năng lượng: ${invoice.energy_consumed} kWh
- Thời gian: ${invoice.duration} phút
- Đơn giá: ${invoice.price_per_kwh?.toLocaleString('vi-VN')} ₫/kWh

Tổng cộng: ${invoice.total_amount?.toLocaleString('vi-VN')} ₫
━━━━━━━━━━━━━━━━━━━━
      `.trim();

      await Share.share({
        message,
        title: 'Hóa đơn sạc xe',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      Alert.alert('Thông báo', 'Tính năng tải xuống PDF sẽ được cập nhật sớm');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải xuống hóa đơn');
    } finally {
      setDownloading(false);
    }
  };

  if (invoiceLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Đang tải hóa đơn...</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <MaterialIcons name="receipt-long" size={64} color={colors.onSurfaceVariant} />
        <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>Không tìm thấy hóa đơn</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.onPrimary + '20' }]}>
          <MaterialIcons name="receipt-long" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.onPrimary }]}>Hóa đơn thanh toán</Text>
        <Text style={[styles.invoiceNumber, { color: colors.onPrimary }]}>#{invoice.invoice_number || invoice.id}</Text>
        <Text style={{ color: colors.onPrimary + 'CC', fontSize: 14 }}>
          {new Date(invoice.created_at).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Station Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Thông tin trạm sạc</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow icon="location-on" label="Trạm sạc" value={invoice.station_name} />
          <InfoRow icon="business" label="Địa chỉ" value={invoice.station_address || 'N/A'} />
        </View>
      </View>

      {/* Charging Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Chi tiết sạc</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow icon="bolt" label="Năng lượng tiêu thụ" value={`${invoice.energy_consumed} kWh`} />
          <InfoRow icon="access-time" label="Thời gian sạc" value={`${invoice.duration} phút`} />
          <InfoRow icon="speed" label="Công suất trung bình" value={`${invoice.avg_power || 'N/A'} kW`} />
        </View>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Chi phí</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow icon="attach-money" label="Đơn giá điện" value={`${invoice.price_per_kwh?.toLocaleString('vi-VN')} ₫/kWh`} />
          <InfoRow icon="calculate" label="Tiền điện" value={`${invoice.energy_cost?.toLocaleString('vi-VN')} ₫`} />
          <InfoRow icon="build" label="Phí dịch vụ" value={`${invoice.service_fee?.toLocaleString('vi-VN') || 0} ₫`} />
          {invoice.parking_fee > 0 && (
            <InfoRow icon="directions-car" label="Phí đỗ xe" value={`${invoice.parking_fee?.toLocaleString('vi-VN')} ₫`} />
          )}
          <View style={[styles.divider, { backgroundColor: colors.onSurfaceVariant }]} />
          <View style={styles.totalRow}>
            <View style={styles.totalLeft}>
              <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
              <Text style={[styles.totalLabel, { color: colors.onBackground }]}>Tổng cộng</Text>
            </View>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{invoice.total_amount?.toLocaleString('vi-VN')} ₫</Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Thanh toán</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow icon="credit-card" label="Phương thức" value={invoice.payment_method || 'Ví điện tử'} />
          <InfoRow
            icon="check-circle"
            label="Trạng thái"
            value={invoice.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={colors.onPrimary} />
          <Text style={[styles.shareButtonText, { color: colors.onPrimary }]}>Chia sẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.secondary }]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <MaterialIcons name="download" size={20} color={colors.onPrimary} />
          )}
          <Text style={[styles.downloadButtonText, { color: colors.onPrimary }]}>
            {downloading ? 'Đang tải...' : 'Tải PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
          Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  button: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 24 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  header: { padding: 24, alignItems: 'center' },
  headerIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  invoiceNumber: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  card: { borderRadius: 12, padding: 16 },
  divider: { height: 1, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  totalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', padding: 16, gap: 12 },
  shareButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, gap: 8 },
  shareButtonText: { fontSize: 16, fontWeight: '600' },
  downloadButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, gap: 8 },
  downloadButtonText: { fontSize: 16, fontWeight: '600' },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { fontSize: 14, textAlign: 'center' },
});

export default InvoiceScreen;
