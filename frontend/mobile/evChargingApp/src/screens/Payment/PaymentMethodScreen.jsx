import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, RadioButton, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: colors.onSurface },
  amount: { fontSize: 18, fontWeight: '500', marginBottom: 24, textAlign: 'center', color: colors.primary },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedMethodItem: {
    borderColor: colors.primary,
  },
  methodDetails: { marginLeft: 16, flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: colors.onSurface },
  methodDescription: { fontSize: 14, color: colors.onSurface, opacity: 0.7 },
  button: { marginTop: 'auto', paddingVertical: 8 },
});

const PaymentMethodScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const { invoiceId, amount } = route.params;
  const { wallet } = useSelector((state) => state.wallet || {});

  const [selectedMethod, setSelectedMethod] = useState('wallet'); // 'wallet', 'bank_transfer', 'credit_card'

  const paymentMethods = [
    { id: 'wallet', title: 'Ví điện tử', description: `Số dư: ${wallet?.balance?.toLocaleString('vi-VN') || 0} ₫` },
    { id: 'bank_transfer', title: 'Chuyển khoản ngân hàng', description: 'Thanh toán qua ứng dụng ngân hàng' },
    { id: 'credit_card', title: 'Thẻ tín dụng/ghi nợ', description: 'Sử dụng thẻ Visa, Mastercard' },
  ];

  const handleContinue = () => {
    navigation.navigate('PaymentConfirmScreen', {
      invoiceId,
      amount,
      paymentMethod: selectedMethod,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Chọn phương thức thanh toán</Text>
      <Text style={styles.amount}>Số tiền: {amount.toLocaleString('vi-VN')} ₫</Text>

      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.methodItem, selectedMethod === item.id && styles.selectedMethodItem]}
            onPress={() => setSelectedMethod(item.id)}
          >
            <RadioButton.Android
              value={item.id}
              status={selectedMethod === item.id ? 'checked' : 'unchecked'}
              onPress={() => setSelectedMethod(item.id)}
            />
            <View style={styles.methodDetails}>
              <Text style={styles.methodTitle}>{item.title}</Text>
              <Text style={styles.methodDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
};

export default PaymentMethodScreen;

