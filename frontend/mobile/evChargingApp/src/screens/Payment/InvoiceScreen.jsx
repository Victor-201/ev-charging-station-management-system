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
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import useCharging from '../../hooks/useCharging';

const InvoiceScreen = () => {
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
      // TODO: Implement PDF download functionality
      Alert.alert('Thông báo', 'Tính năng tải xuống PDF sẽ được cập nhật sớm');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải xuống hóa đơn');
    } finally {
      setDownloading(false);
    }
  };

  if (invoiceLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải hóa đơn...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="receipt-outline" size={64} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.errorText}>Không tìm thấy hóa đơn</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="receipt" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Hóa đơn thanh toán</Text>
        <Text style={styles.invoiceNumber}>#{invoice.invoice_number || invoice.id}</Text>
        <Text style={styles.invoiceDate}>
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
        <Text style={styles.sectionTitle}>Thông tin trạm sạc</Text>
        <View style={styles.card}>
          <InfoRow icon="location" label="Trạm sạc" value={invoice.station_name} />
          <InfoRow icon="business" label="Địa chỉ" value={invoice.station_address || 'N/A'} />
        </View>
      </View>

      {/* Charging Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chi tiết sạc</Text>
        <View style={styles.card}>
          <InfoRow
            icon="flash"
            label="Năng lượng tiêu thụ"
            value={`${invoice.energy_consumed} kWh`}
          />
          <InfoRow
            icon="time"
            label="Thời gian sạc"
            value={`${invoice.duration} phút`}
          />
          <InfoRow
            icon="speedometer"
            label="Công suất trung bình"
            value={`${invoice.avg_power || 'N/A'} kW`}
          />
        </View>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chi phí</Text>
        <View style={styles.card}>
          <InfoRow
            icon="cash-outline"
            label="Đơn giá điện"
            value={`${invoice.price_per_kwh?.toLocaleString('vi-VN')} ₫/kWh`}
          />
          <InfoRow
            icon="calculator-outline"
            label="Tiền điện"
            value={`${invoice.energy_cost?.toLocaleString('vi-VN')} ₫`}
          />
          <InfoRow
            icon="construct-outline"
            label="Phí dịch vụ"
            value={`${invoice.service_fee?.toLocaleString('vi-VN') || 0} ₫`}
          />
          {invoice.parking_fee > 0 && (
            <InfoRow
              icon="car-outline"
              label="Phí đỗ xe"
              value={`${invoice.parking_fee?.toLocaleString('vi-VN')} ₫`}
            />
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <View style={styles.totalLeft}>
              <Ionicons name="wallet" size={24} color={theme.colors.primary} />
              <Text style={styles.totalLabel}>Tổng cộng</Text>
            </View>
            <Text style={styles.totalValue}>
              {invoice.total_amount?.toLocaleString('vi-VN')} ₫
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thanh toán</Text>
        <View style={styles.card}>
          <InfoRow
            icon="card"
            label="Phương thức"
            value={invoice.payment_method || 'Ví điện tử'}
          />
          <InfoRow
            icon="checkmark-circle"
            label="Trạng thái"
            value={invoice.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.shareButtonText}>Chia sẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Ionicons name="download" size={20} color={theme.colors.onPrimary} />
          )}
          <Text style={styles.downloadButtonText}>
            {downloading ? 'Đang tải...' : 'Tải PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
        </Text>
      </View>
    </ScrollView>
  );
};

// Helper Component
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={20} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.onPrimary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onPrimary,
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onPrimary,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: theme.colors.onPrimary + 'CC',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onBackground,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onBackground,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default InvoiceScreen;

