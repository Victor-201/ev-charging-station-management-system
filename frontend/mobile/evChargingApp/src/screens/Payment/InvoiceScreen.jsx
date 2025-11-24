import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme, ActivityIndicator, Button } from 'react-native-paper';
import useCharging from '../../hooks/useCharging';
import InfoRow from '../../components/common/InfoRow';
import InvoiceHeader from '../../components/invoice/InvoiceHeader';

const InvoiceScreen = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId } = route.params || {};
  const { invoice, invoiceLoading, fetchInvoice } = useCharging();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (sessionId) fetchInvoice(sessionId);
  }, [sessionId]);

  const handleShare = async () => {
    if (!invoice) return;
    try {
      const message = `Hóa đơn #${invoice.invoice_number}: ${invoice.total_amount?.toLocaleString('vi-VN')} ₫. Trạm sạc: ${invoice.station_name}.`;
      await Share.share({ message, title: 'Hóa đơn sạc xe' });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    Alert.alert('Thông báo', 'Tính năng tải xuống PDF sẽ được cập nhật sớm');
    setDownloading(false);
  };

  if (invoiceLoading && !invoice) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Đang tải hóa đơn...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error, marginBottom: 16 }}>Không tìm thấy hóa đơn.</Text>
        <Button onPress={() => navigation.goBack()}>Quay lại</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom', 'left', 'right']}>
      <InvoiceHeader invoice={invoice} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin trạm sạc</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <InfoRow icon="map-marker-outline" label="Trạm sạc" value={invoice.station_name} />
            <InfoRow icon="map-marker-distance" label="Địa chỉ" value={invoice.station_address || 'N/A'} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết sạc</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <InfoRow icon="flash" label="Năng lượng" value={`${invoice.energy_consumed} kWh`} />
            <InfoRow icon="timer-sand" label="Thời gian" value={`${invoice.duration} phút`} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi phí</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <InfoRow icon="tag-outline" label="Đơn giá" value={`${invoice.price_per_kwh?.toLocaleString('vi-VN')} ₫/kWh`} />
            <InfoRow icon="cash" label="Tiền điện" value={`${invoice.energy_cost?.toLocaleString('vi-VN')} ₫`} />
            <InfoRow icon="plus-circle-outline" label="Phí dịch vụ" value={`${invoice.service_fee?.toLocaleString('vi-VN') || 0} ₫`} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <InfoRow icon="credit-card-outline" label="Phương thức" value={invoice.payment_method || 'Ví điện tử'} />
            <InfoRow icon="calendar-check-outline" label="Ngày thanh toán" value={new Date(invoice.paid_at || invoice.created_at).toLocaleDateString('vi-VN')} isLast />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionsContainer, { backgroundColor: colors.surface }]}>
        <Button icon="share-variant-outline" mode="outlined" onPress={handleShare} style={{ flex: 1 }}>Chia sẻ</Button>
        <Button icon="download-outline" mode="contained" onPress={handleDownload} style={{ flex: 1 }} loading={downloading} disabled={downloading}>Tải PDF</Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { borderRadius: 12, padding: 16 },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

export default InvoiceScreen;
