import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function PaymentHistory() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data - sẽ được thay thế bằng API call
  const sampleTransactions = [
    {
      id: '1',
      transaction_id: 'TXN001',
      station_name: 'Trạm sạc Central Park',
      amount: 50000,
      currency: 'VND',
      status: 'completed',
      payment_method: 'card',
      energy_consumed: 25.5,
      duration: '1h 15m',
      created_at: '2024-11-04T14:30:00Z'
    },
    {
      id: '2',
      transaction_id: 'TXN002',
      station_name: 'Trạm sạc Landmark 81',
      amount: 75000,
      currency: 'VND',
      status: 'pending',
      payment_method: 'wallet',
      energy_consumed: 38.2,
      duration: '1h 45m',
      created_at: '2024-11-03T10:15:00Z'
    },
    {
      id: '3',
      transaction_id: 'TXN003',
      station_name: 'Trạm sạc Vincom',
      amount: 30000,
      currency: 'VND',
      status: 'failed',
      payment_method: 'card',
      energy_consumed: 0,
      duration: '0m',
      created_at: '2024-11-02T16:20:00Z'
    }
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      // TODO: Call payment API
      setTransactions(sampleTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      case 'refunded': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Thành công';
      case 'pending': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card': return 'credit-card';
      case 'wallet': return 'account-balance-wallet';
      case 'cash': return 'money';
      default: return 'payment';
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'card': return 'Thẻ tín dụng';
      case 'wallet': return 'Ví điện tử';
      case 'cash': return 'Tiền mặt';
      default: return method;
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Icon 
            name={getPaymentMethodIcon(item.payment_method)} 
            size={20} 
            color="#2196F3" 
          />
          <Text style={styles.stationName}>{item.station_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatCurrency(item.amount, item.currency)}</Text>
        <Text style={styles.transactionId}>#{item.transaction_id}</Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Icon name="flash-on" size={16} color="#666" />
          <Text style={styles.detailText}>{item.energy_consumed} kWh</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.detailText}>{item.duration}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="payment" size={16} color="#666" />
          <Text style={styles.detailText}>{getPaymentMethodText(item.payment_method)}</Text>
        </View>
      </View>
      
      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {/* TODO: Open filter modal */}}
        >
          <Icon name="filter-list" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="receipt" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
          <Text style={styles.emptySubtitle}>
            Các giao dịch thanh toán sẽ hiển thị ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  transactionId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  transactionDetails: {
    gap: 6,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
