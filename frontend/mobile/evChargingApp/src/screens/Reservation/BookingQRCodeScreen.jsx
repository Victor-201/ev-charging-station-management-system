import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: colors.primary },
  subtitle: { fontSize: 16, textAlign: 'center', color: colors.onSurfaceVariant, marginBottom: 24 },
  qrContainer: { alignItems: 'center', marginVertical: 32, padding: 16, backgroundColor: colors.background, borderRadius: 16, elevation: 4, shadowColor: colors.onBackground },
  detailCard: { backgroundColor: colors.surface, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { color: colors.onSurfaceVariant },
  detailValue: { fontWeight: 'bold', color: colors.onSurface },
  footer: { marginTop: 24 },
});

const BookingQRCodeScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { reservation, qrData } = route.params;

  const details = [
    { label: 'Trạm sạc', value: reservation.station_name },
    { label: 'Địa chỉ', value: reservation.station_address },
    { label: 'Ngày', value: new Date(reservation.start_time).toLocaleDateString('vi-VN') },
    { label: 'Giờ', value: new Date(reservation.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) },
    { label: 'Cổng sạc', value: reservation.connector_type },
    { label: 'Mã đặt chỗ', value: `#${reservation.id}` },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Icon name="check-circle" size={64} color={colors.success} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={styles.title}>Đặt chỗ thành công!</Text>
        <Text style={styles.subtitle}>Đưa mã QR này vào máy quét tại trạm sạc</Text>

        <View style={styles.qrContainer}>
          {qrData ? (
            <QRCode
              value={JSON.stringify(qrData)}
              size={220}
              backgroundColor={colors.background}
              color={colors.onBackground}
            />
          ) : (
            <Text>Không thể tạo mã QR.</Text>
          )}
        </View>

        <Card style={styles.detailCard}>
          <Card.Content>
            {details.map((item, index) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={() => navigation.popToTop() && navigation.navigate('HistoryTab')}
          >
            Xem tất cả đặt chỗ
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingQRCodeScreen;

