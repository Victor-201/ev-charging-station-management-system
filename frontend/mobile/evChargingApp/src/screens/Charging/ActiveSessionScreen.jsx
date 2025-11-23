import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import chargingService from '../../services/chargingService';
import bookingService from '../../services/bookingService';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.onBackground,
    marginBottom: 30,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.onSurface,
    marginLeft: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.errorContainer,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: colors.onErrorContainer,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
});

const ActiveSessionScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { reservation } = route.params || {};
  const { station, point, connectorType } = reservation || {};

  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const initiateSession = async () => {
      if (!reservation?.id) {
        setError('Không tìm thấy thông tin đặt chỗ.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await chargingService.initiate(reservation.id);
        if (response && response.session_id) {
          setSessionId(response.session_id);
        } else {
          throw new Error('Không nhận được Session ID từ server.');
        }
      } catch (err) {
        console.error('Failed to initiate session:', err);
        setError(err.response?.data?.message || 'Không thể khởi tạo phiên sạc.');
      } finally {
        setLoading(false);
      }
    };

    initiateSession();
  }, [reservation?.id]);

  const qrPayload = useMemo(() => {
    if (!sessionId) return null;
    return JSON.stringify({
      sessionId: sessionId,
      action: 'START_CHARGE',
    });
  }, [sessionId]);

  const handleCancel = () => {
    Alert.alert(
      'Hủy đặt chỗ',
      'Bạn có chắc chắn muốn hủy đặt chỗ này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Có',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await bookingService.cancelBooking(reservation.id);
              Alert.alert('Thành công', 'Đặt chỗ của bạn đã được hủy.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy đặt chỗ.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ textAlign: 'center', marginTop: 10, color: colors.onBackground }}>Đang tạo phiên sạc...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Quét mã để bắt đầu sạc</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {qrPayload && (
          <View style={styles.qrContainer}>
            <QRCode
              value={qrPayload}
              size={220}
              backgroundColor='white'
              color='black'
            />
          </View>
        )}

        {station && point && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="ev-station" size={24} color={colors.primary} />
              <Text style={styles.infoText}>{station.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="electrical-services" size={24} color={colors.primary} />
              <Text style={styles.infoText}>Điểm sạc: {point.point_name || `P${point.id}`}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="settings-input-component" size={24} color={colors.primary} />
              <Text style={styles.infoText}>Cổng: {connectorType}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.cancelButton, isCancelling && { opacity: 0.7 }]}
        onPress={handleCancel}
        disabled={isCancelling}
      >
        {isCancelling ? (
          <ActivityIndicator color={colors.onErrorContainer} />
        ) : (
          <>
            <Icon name="cancel" size={20} color={colors.onErrorContainer} />
            <Text style={styles.cancelButtonText}>Hủy đặt chỗ</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ActiveSessionScreen;


