import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { createPayment } from '../../store/slices/paymentSlice'; // To be created

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', color: colors.onSurface },
  card: { backgroundColor: colors.surface },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  label: { fontSize: 16, color: colors.onSurface, opacity: 0.7 },
  value: { fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize', color: colors.onSurface },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 16 },
  button: { marginTop: 32, paddingVertical: 8 },
});

const PaymentConfirmScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.payment || {});
  const { invoiceId, amount, paymentMethod } = route.params;

  const handleConfirmPayment = async () => {
    const payload = {
      invoice_id: invoiceId,
      user_id: user.id,
      amount,
      method: paymentMethod,
    };

    const result = await dispatch(createPayment(payload));

    if (result.type === 'payment/create/fulfilled') {
      navigation.navigate('PaymentStatusScreen', { success: true, transactionId: result.payload.id });
    } else {
      navigation.navigate('PaymentStatusScreen', { success: false, error: result.payload?.message });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác nhận thanh toán</Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Số tiền</Text>
            <Text style={styles.value}>{amount.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Phương thức</Text>
            <Text style={styles.value}>{paymentMethod.replace('_', ' ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Mã hóa đơn</Text>
            <Text style={styles.value}>{invoiceId}</Text>
          </View>
        </Card.Content>
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        mode="contained"
        onPress={handleConfirmPayment}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
      </Button>
    </View>
  );
};

export default PaymentConfirmScreen;

