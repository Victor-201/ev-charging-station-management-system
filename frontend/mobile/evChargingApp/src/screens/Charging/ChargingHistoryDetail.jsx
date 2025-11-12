import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import useCharging from '../../hooks/useCharging';

const ChargingHistoryDetail = () => {
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
        return theme.colors.success;
      case 'active':
      case 'charging':
        return theme.colors.primary;
      case 'paused':
        return theme.colors.warning;
      case 'failed':
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Không tìm thấy phiên sạc</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentSession.status) + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor(currentSession.status) }]}>
          {getStatusText(currentSession.status)}
        </Text>
      </View>

      {/* Station Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin trạm sạc</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Trạm sạc:</Text>
            <Text style={styles.infoValue}>{currentSession.station_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flash" size={20} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Cổng sạc:</Text>
            <Text style={styles.infoValue}>{currentSession.charger_id || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Charging Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chi tiết sạc</Text>
        <View style={styles.infoCard}>
          <DetailRow
            icon="calendar-outline"
            label="Bắt đầu"
            value={formatDate(currentSession.start_time)}
          />
          <DetailRow
            icon="calendar-outline"
            label="Kết thúc"
            value={formatDate(currentSession.end_time)}
          />
          <DetailRow
            icon="time-outline"
            label="Thời gian"
            value={formatDuration(currentSession.duration)}
          />
          <DetailRow
            icon="flash-outline"
            label="Năng lượng"
            value={currentSession.energy_delivered ? `${currentSession.energy_delivered.toFixed(2)} kWh` : 'N/A'}
          />
          <DetailRow
            icon="speedometer-outline"
            label="Công suất TB"
            value={currentSession.avg_power ? `${currentSession.avg_power.toFixed(1)} kW` : 'N/A'}
          />
        </View>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chi phí</Text>
        <View style={styles.infoCard}>
          <DetailRow
            icon="flash-outline"
            label="Tiền điện"
            value={formatCurrency(currentSession.energy_cost)}
          />
          <DetailRow
            icon="time-outline"
            label="Phí dịch vụ"
            value={formatCurrency(currentSession.service_fee)}
          />
          {currentSession.parking_fee > 0 && (
            <DetailRow
              icon="car-outline"
              label="Phí đỗ xe"
              value={formatCurrency(currentSession.parking_fee)}
            />
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatCurrency(currentSession.total_cost)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      {currentSession.payment_method && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.infoCard}>
            <DetailRow
              icon="card-outline"
              label="Phương thức"
              value={currentSession.payment_method === 'wallet' ? 'Ví điện tử' : currentSession.payment_method}
            />
            <DetailRow
              icon="checkmark-circle-outline"
              label="Trạng thái"
              value={currentSession.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            />
          </View>
        </View>
      )}

      {/* View Invoice Button */}
      {currentSession.status === 'completed' && (
        <TouchableOpacity
          style={styles.invoiceButton}
          onPress={handleViewInvoice}
          disabled={invoiceLoading}
        >
          {invoiceLoading ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.invoiceButtonText}>Xem hóa đơn</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

// Helper component for detail rows
const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={18} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
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
    color: theme.colors.error,
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onBackground,
    flex: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onBackground,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  invoiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
});

export default ChargingHistoryDetail;

