import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, Title, RadioButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { theme } from '../../config/theme';

const PaymentMethodScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoiceId, amount } = route.params;
  const { wallet } = useSelector((state) => state.wallet);

  const [selectedMethod, setSelectedMethod] = useState('wallet'); // 'wallet', 'bank_transfer', 'credit_card'

  const paymentMethods = [
    { id: 'wallet', title: 'Ví điện tử', description: `Số dư: ${wallet?.balance?.toLocaleString('vi-VN') || 0} ₫` },
    { id: 'bank_transfer', title: 'Chuyển khoản ngân hàng', description: 'Thanh toán qua ứng dụng ngân hàng' },
    { id: 'credit_card', title: 'Thẻ tín dụng/ghi nợ', description: 'Sử dụng thẻ Visa, Mastercard' },
  ];

  const handleContinue = () => {
    navigation.navigate('PaymentConfirm', {
      invoiceId,
      amount,
      paymentMethod: selectedMethod,
    });
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Chọn phương thức thanh toán</Title>
      <Text style={styles.amount}>Số tiền: {amount.toLocaleString('vi-VN')} ₫</Text>

      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.methodItem}>
            <RadioButton.Android 
              value={item.id} 
              status={selectedMethod === item.id ? 'checked' : 'unchecked'}
              onPress={() => setSelectedMethod(item.id)}
            />
            <View style={styles.methodDetails}>
              <Text style={styles.methodTitle}>{item.title}</Text>
              <Text style={styles.methodDescription}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <Button 
        mode="contained" 
        onPress={handleContinue}
        style={styles.button}
        disabled={!selectedMethod}
      >
        Tiếp tục
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  amount: { fontSize: 18, fontWeight: '500', marginBottom: 24, textAlign: 'center', color: theme.colors.primary },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  methodDetails: { marginLeft: 16 },
  methodTitle: { fontSize: 16, fontWeight: 'bold' },
  methodDescription: { fontSize: 14, color: theme.colors.onSurface + '80' },
  button: { marginTop: 'auto', paddingVertical: 8 },
});

export default PaymentMethodScreen;

