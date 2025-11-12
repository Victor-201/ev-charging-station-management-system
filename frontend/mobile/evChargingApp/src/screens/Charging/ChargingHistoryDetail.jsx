import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useCharging from '../../hooks/useCharging';
import { useTheme } from 'react-native-paper';

const ChargingHistoryDetail = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId } = route.params || {};
  const { currentSession, invoice, loading, invoiceLoading, getSession, fetchInvoice } = useCharging();
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (sessionId) {
      getSession(sessionId);
    }
  }, [sessionId, getSession]);

  const handleViewInvoice = async () => {
    if (!invoice && sessionId) {
      await fetchInvoice(sessionId);
    }
    setShowInvoice(true);
    navigation.navigate('Invoice', { sessionId });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'active':
      case 'charging':
        return colors.primary;
      case 'paused':
        return colors.warning;
      case 'failed':
      case 'error':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Hoàn thành';
      case 'active':
      case 'charging':
        return 'Đang sạc';
      case 'paused':
        return 'Tạm dừng';
      case 'failed':
        return 'Thất bại';
      case 'error':
        return 'Lỗi';
      default:
        return status || 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Đang tải chi tiết...</Text>
      </SafeAreaView>
    );
  }

  if (!currentSession) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Icon name="error-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Không tìm thấy phiên sạc</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(currentSession.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(currentSession.status) }]}>
            {getStatusText(currentSession.status)}
          </Text>
        </View>

        {/* Station Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Thông tin trạm sạc</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Trạm sạc:</Text>
              <Text style={[styles.infoValue, { color: colors.onBackground }]}>{currentSession.station_name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="bolt" size={20} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>Cổng sạc:</Text>
              <Text style={[styles.infoValue, { color: colors.onBackground }]}>{currentSession.charger_id || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Charging Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Chi tiết sạc</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <DetailRow icon="calendar-today" label="Bắt đầu" value={formatDate(currentSession.start_time)} colors={colors} />
            <DetailRow icon="calendar-today" label="Kết thúc" value={formatDate(currentSession.end_time)} colors={colors} />
            <DetailRow icon="schedule" label="Thời gian" value={formatDuration(currentSession.duration)} colors={colors} />
            <DetailRow icon="flash-on" label="Năng lượng" value={currentSession.energy_delivered ? `${currentSession.energy_delivered.toFixed(2)} kWh` : 'N/A'} colors={colors} />
            <DetailRow icon="speed" label="Công suất TB" value={currentSession.avg_power ? `${currentSession.avg_power.toFixed(1)} kW` : 'N/A'} colors={colors} />
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Chi phí</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <DetailRow icon="flash-on" label="Tiền điện" value={formatCurrency(currentSession.energy_cost)} colors={colors} />
            <DetailRow icon="timer" label="Phí dịch vụ" value={formatCurrency(currentSession.service_fee)} colors={colors} />
            {currentSession.parking_fee > 0 && (
              <DetailRow icon="local-parking" label="Phí đỗ xe" value={formatCurrency(currentSession.parking_fee)} colors={colors} />
            )}
            <View style={[styles.divider, { backgroundColor: colors.outline }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.onBackground }]}>Tổng cộng</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(currentSession.total_cost)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {currentSession.payment_method && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Thanh toán</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <DetailRow icon="credit-card" label="Phương thức" value={currentSession.payment_method === 'wallet' ? 'Ví điện tử' : currentSession.payment_method} colors={colors} />
              <DetailRow icon="check-circle-outline" label="Trạng thái" value={currentSession.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} colors={colors} />
            </View>
          </View>
        )}

        {/* View Invoice Button */}
        {currentSession.status === 'completed' && (
          <TouchableOpacity style={[styles.invoiceButton, { backgroundColor: colors.primary }]} onPress={handleViewInvoice} disabled={invoiceLoading}>
            {invoiceLoading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Icon name="receipt-long" size={20} color={colors.onPrimary} />
                <Text style={[styles.invoiceButtonText, { color: colors.onPrimary }]}>Xem hóa đơn</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// DetailRow component
const DetailRow = ({ icon, label, value, colors }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Icon name={icon} size={18} color={colors.onSurfaceVariant} />
      <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, { color: colors.onBackground }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { marginTop: 16, fontSize: 18, textAlign: 'center' },
  statusBadge: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  statusText: { fontSize: 16, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  infoCard: { borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '500', flex: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  invoiceButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 8, gap: 8 },
  invoiceButtonText: { fontSize: 16, fontWeight: '600' },
});

export default ChargingHistoryDetail;
