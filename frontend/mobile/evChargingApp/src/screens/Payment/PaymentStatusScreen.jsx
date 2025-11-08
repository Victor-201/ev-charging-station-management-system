import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Title, Card } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../config/theme';

const PaymentStatusScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { success, transactionId, error } = route.params;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Icon 
            name={success ? 'check-circle-outline' : 'close-circle-outline'}
            size={80}
            color={success ? theme.colors.success : theme.colors.error}
            style={styles.icon}
          />
          <Title style={styles.title}>{success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</Title>
          
          {success && transactionId && (
            <Text style={styles.message}>Mã giao dịch của bạn là: {transactionId}</Text>
          )}
          
          {error && (
            <Text style={styles.message}>{error}</Text>
          )}

          <Button 
            mode="contained" 
            onPress={() => navigation.popToTop()} // Go back to the top of the stack
            style={styles.button}
          >
            Về trang chủ
          </Button>

          {success && (
             <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: transactionId })} // Assuming transactionId can be used to fetch invoice
              style={styles.button}
            >
              Xem hóa đơn
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: theme.colors.background, 
    justifyContent: 'center' 
  },
  card: {
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 8,
    marginTop: 12,
  },
});

export default PaymentStatusScreen;

