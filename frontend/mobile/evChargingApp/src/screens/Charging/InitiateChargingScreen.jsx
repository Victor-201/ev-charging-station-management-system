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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import useCharging from '../../hooks/useCharging';
import InfoRow from '../../components/common/InfoRow';

const InitiateChargingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { reservation } = route.params || {};
  const { initiate, start, loading } = useCharging();
  const [initiating, setInitiating] = useState(false);

  const handleInitiateCharging = async () => {
    if (!reservation?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đặt chỗ');
      return;
    }

    setInitiating(true);
    try {
      const initiateResult = await initiate(reservation.id);
      if (initiateResult.error)
        throw new Error(initiateResult.error.message || 'Không thể khởi tạo phiên sạc');
      const session = initiateResult.payload;

      const startResult = await start(session.id);
      if (startResult.error)
        throw new Error(startResult.error.message || 'Không thể bắt đầu sạc');

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
          { text: 'Thử lại', onPress: () => setInitiating(false) },
          { text: 'Hủy', onPress: () => navigation.goBack(), style: 'cancel' },
        ]
      );
      setInitiating(false);
    }
  };

  if (!reservation) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Không tìm thấy thông tin đặt chỗ</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success }]}>
            <MaterialIcons name="check-circle" size={80} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.onBackground }]}>Xác thực thành công!</Text>
          <Text style={[styles.successSubtitle, { color: colors.onSurfaceVariant }]}>Sẵn sàng bắt đầu sạc</Text>
        </View>

        {/* Reservation Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Thông tin đặt chỗ</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <InfoRow icon="location-on" label="Trạm sạc" value={reservation.station_name || 'N/A'} />
            <InfoRow icon="power" label="Cổng sạc" value={reservation.charger_id || reservation.connector_type || 'N/A'} />
            <InfoRow icon="event" label="Ngày" value={reservation.date || 'N/A'} />
            <InfoRow icon="access-time" label="Thời gian" value={reservation.time || reservation.start_time || 'N/A'} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Hướng dẫn</Text>
          <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
            <InstructionItem number="1" text="Đảm bảo xe đã đỗ đúng vị trí và tắt máy" colors={colors} />
            <InstructionItem number="2" text="Cắm dây sạc vào cổng sạc của xe" colors={colors} />
            <InstructionItem number="3" text="Nhấn nút 'Bắt đầu sạc' bên dưới" colors={colors} />
            <InstructionItem number="4" text="Theo dõi quá trình sạc trên màn hình" colors={colors} />
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }, (initiating || loading) && styles.startButtonDisabled]}
          onPress={handleInitiateCharging}
          disabled={initiating || loading}
        >
          {initiating || loading ? (
            <>
              <ActivityIndicator size="small" color={colors.onPrimary} />
              <Text style={[styles.startButtonText, { color: colors.onPrimary }]}>Đang khởi động...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="flash-on" size={24} color={colors.onPrimary} />
              <Text style={[styles.startButtonText, { color: colors.onPrimary }]}>Bắt đầu sạc</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={initiating || loading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.onSurfaceVariant }]}>Hủy</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Instruction helper
const InstructionItem = ({ number, text, colors }) => (
  <View style={styles.instructionItem}>
    <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
      <Text style={[styles.instructionNumberText, { color: colors.onPrimary }]}>{number}</Text>
    </View>
    <Text style={[styles.instructionText, { color: colors.onBackground }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  button: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 24 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  iconContainer: { alignItems: 'center', marginVertical: 32 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  successSubtitle: { fontSize: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  infoCard: { borderRadius: 12, padding: 16 },
  instructionsCard: { borderRadius: 12, padding: 16 },
  instructionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  instructionNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  instructionNumberText: { fontSize: 14, fontWeight: '700' },
  instructionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 8, gap: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  startButtonDisabled: { opacity: 0.6 },
  startButtonText: { fontSize: 18, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: 12, marginTop: 12 },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
});

export default InitiateChargingScreen;
