import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import useCharging from '../../hooks/useCharging';

const InitiateChargingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { reservation, qrId } = route.params || {};
  const { initiate, start, loading } = useCharging();
  const [initiating, setInitiating] = useState(false);

  const handleInitiateCharging = async () => {
    if (!reservation?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đặt chỗ');
      return;
    }

    setInitiating(true);

    try {
      // Step 1: Initiate charging session from reservation
      const initiateResult = await initiate(reservation.id);

      if (initiateResult.error) {
        throw new Error(initiateResult.error.message || 'Không thể khởi tạo phiên sạc');
      }

      const session = initiateResult.payload;

      // Step 2: Start the charging session
      const startResult = await start(session.id);

      if (startResult.error) {
        throw new Error(startResult.error.message || 'Không thể bắt đầu sạc');
      }

      // Navigate to active charging screen
      navigation.replace('Charging', {
        screen: 'ActiveCharging',
        params: { sessionId: session.id },
      });
    } catch (error) {
      console.error('Initiate charging error:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể bắt đầu phiên sạc. Vui lòng thử lại.',
        [
          {
            text: 'Thử lại',
            onPress: () => setInitiating(false),
          },
          {
            text: 'Hủy',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
      setInitiating(false);
    }
  };

  if (!reservation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Không tìm thấy thông tin đặt chỗ</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
        </View>
        <Text style={styles.successTitle}>Xác thực thành công!</Text>
        <Text style={styles.successSubtitle}>Sẵn sàng bắt đầu sạc</Text>
      </View>

      {/* Reservation Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin đặt chỗ</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon="location"
            label="Trạm sạc"
            value={reservation.station_name || 'N/A'}
          />
          <InfoRow
            icon="flash"
            label="Cổng sạc"
            value={reservation.charger_id || reservation.connector_type || 'N/A'}
          />
          <InfoRow
            icon="calendar"
            label="Ngày"
            value={reservation.date || 'N/A'}
          />
          <InfoRow
            icon="time"
            label="Thời gian"
            value={reservation.time || reservation.start_time || 'N/A'}
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hướng dẫn</Text>
        <View style={styles.instructionsCard}>
          <InstructionItem
            number="1"
            text="Đảm bảo xe đã đỗ đúng vị trí và tắt máy"
          />
          <InstructionItem
            number="2"
            text="Cắm dây sạc vào cổng sạc của xe"
          />
          <InstructionItem
            number="3"
            text="Nhấn nút 'Bắt đầu sạc' bên dưới"
          />
          <InstructionItem
            number="4"
            text="Theo dõi quá trình sạc trên màn hình"
          />
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[styles.startButton, initiating && styles.startButtonDisabled]}
        onPress={handleInitiateCharging}
        disabled={initiating || loading}
      >
        {initiating || loading ? (
          <>
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            <Text style={styles.startButtonText}>Đang khởi động...</Text>
          </>
        ) : (
          <>
            <Ionicons name="flash" size={24} color={theme.colors.onPrimary} />
            <Text style={styles.startButtonText}>Bắt đầu sạc</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={initiating || loading}
      >
        <Text style={styles.cancelButtonText}>Hủy</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Helper Components
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const InstructionItem = ({ number, text }) => (
  <View style={styles.instructionItem}>
    <View style={styles.instructionNumber}>
      <Text style={styles.instructionNumberText}>{number}</Text>
    </View>
    <Text style={styles.instructionText}>{text}</Text>
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
    color: theme.colors.error,
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
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
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
  instructionsCard: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 12,
    padding: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onBackground,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
});

export default InitiateChargingScreen;

