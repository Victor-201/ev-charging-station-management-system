import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Title, Card, Paragraph, ActivityIndicator, Divider } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getInvoice, downloadInvoice } from '../../store/slices/paymentSlice'; // To be updated
import { theme } from '../../config/theme';

const InvoiceScreen = () => {
  const route = useRoute();
  const dispatch = useDispatch();
  const { invoiceId } = route.params;
  const { invoice, loading, error } = useSelector((state) => state.payment || {});

  useEffect(() => {
    if (invoiceId) {
      dispatch(getInvoice(invoiceId));
    }
  }, [dispatch, invoiceId]);

  const handleDownload = async () => {
    const result = await dispatch(downloadInvoice(invoiceId));
    if (result.type === 'payment/downloadInvoice/fulfilled') {
      // Here you would use a library like react-native-fs to save the file
      // and react-native-file-viewer to open it.
      Alert.alert('Tải xuống thành công', 'Hóa đơn đã được lưu vào thiết bị của bạn.');
    } else {
      Alert.alert('Lỗi', 'Không thể tải xuống hóa đơn.');
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error || !invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Không thể tải thông tin hóa đơn.'}</Text>
        <Button onPress={() => dispatch(getInvoice(invoiceId))}>Thử lại</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Hóa đơn #{invoice.id}</Title>
          <Paragraph style={styles.date}>{new Date(invoice.created_at).toLocaleString('vi-VN')}</Paragraph>
          
          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={[styles.value, { color: invoice.status === 'paid' ? theme.colors.success : theme.colors.error }]}>
              {invoice.status}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Khách hàng:</Text>
            <Text style={styles.value}>{invoice.customer_name}</Text>
          </View>

          <Divider style={styles.divider} />

          <Title style={styles.itemsTitle}>Chi tiết</Title>
          {invoice.items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemAmount}>{item.amount.toLocaleString('vi-VN')} ₫</Text>
            </View>
          ))}

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>{invoice.total_amount.toLocaleString('vi-VN')} ₫</Text>
          </View>

        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        icon="download"
        onPress={handleDownload}
        style={styles.button}
        disabled={loading}
      >
        Tải hóa đơn (PDF)
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.colors.error, marginBottom: 16, textAlign: 'center' },
  card: { marginBottom: 24 },
  title: { textAlign: 'center', marginBottom: 8 },
  date: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginBottom: 16 },
  divider: { marginVertical: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: '500', textTransform: 'capitalize' },
  itemsTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemDescription: { flex: 1, marginRight: 8 },
  itemAmount: { fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
  button: { paddingVertical: 8 },
});

export default InvoiceScreen;

