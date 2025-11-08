import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Title, Card, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { createPayment } from '../../store/slices/paymentSlice'; // To be created
import { theme } from '../../config/theme';

const PaymentConfirmScreen = () => {
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
      navigation.navigate('PaymentStatus', { success: true, transactionId: result.payload.id });
    } else {
      navigation.navigate('PaymentStatus', { success: false, error: result.payload?.message });
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Xác nhận thanh toán</Title>

      <Card>
        <Card.Content>
          <View style={styles.detailRow}>
            <Paragraph style={styles.label}>Số tiền</Paragraph>
            <Paragraph style={styles.value}>{amount.toLocaleString('vi-VN')} ₫</Paragraph>
          </View>
          <View style={styles.detailRow}>
            <Paragraph style={styles.label}>Phương thức</Paragraph>
            <Paragraph style={styles.value}>{paymentMethod.replace('_', ' ')}</Paragraph>
          </View>
          <View style={styles.detailRow}>
            <Paragraph style={styles.label}>Mã hóa đơn</Paragraph>
            <Paragraph style={styles.value}>{invoiceId}</Paragraph>
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  label: { fontSize: 16, color: theme.colors.onSurfaceVariant },
  value: { fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' },
  errorText: { color: theme.colors.error, textAlign: 'center', marginTop: 16 },
  button: { marginTop: 32, paddingVertical: 8 },
});

export default PaymentConfirmScreen;

