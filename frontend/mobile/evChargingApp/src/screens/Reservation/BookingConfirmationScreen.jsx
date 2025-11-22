import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import reservationService from '../../services/reservationService';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function BookingConfirmationScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { reservationId, station, bookingDetails } = route.params;

  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const response = await reservationService.createQrCode(reservationId);
        setQrCode(response.qr_code);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
      fetchQrCode();
    }
  }, [reservationId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đặt chỗ thành công!</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text>Đang tạo mã QR...</Text>
          </View>
        ) : (
          <>
            <View style={styles.qrContainer}>
              {qrCode ? (
                <QRCode value={qrCode} size={200} />
              ) : (
                <Text>Không thể tạo mã QR.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết đặt chỗ</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trạm sạc:</Text>
                  <Text style={styles.summaryValue}>{station.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Địa chỉ:</Text>
                  <Text style={styles.summaryValue}>{station.address}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ngày:</Text>
                  <Text style={styles.summaryValue}>{bookingDetails.date}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giờ:</Text>
                  <Text style={styles.summaryValue}>{bookingDetails.time}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={() => navigation.popToTop()}>
              <Text style={styles.doneButtonText}>Hoàn tất</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
