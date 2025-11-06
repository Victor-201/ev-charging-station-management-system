import React from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/constants';
import { logout as logoutAction } from '../../store/slices/authSlice';

import Header from '../../components/layout/Header';
import QuickActionCard from '../../components/cards/QuickActionCard';
import StatCard from '../../components/cards/StatCard';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            dispatch(logoutAction());
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const quickActions = [
    { id: 'find-station', title: 'Tìm trạm sạc', subtitle: 'Tìm trạm sạc gần nhất', onPress: () => navigation.navigate('Map') },
    { id: 'book-charging', title: 'Đặt chỗ sạc', subtitle: 'Đặt trước thời gian sạc', onPress: () => navigation.navigate('Reservation') },
    { id: 'payment-history', title: 'Lịch sử thanh toán', subtitle: 'Xem các giao dịch', onPress: () => navigation.navigate('Payment') },
    { id: 'notifications', title: 'Thông báo', subtitle: 'Tin tức và cập nhật', onPress: () => navigation.navigate('Notification') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header user={user} onLogout={handleLogout} />

      {/* Thao tác nhanh */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.brand600 }]}>Thao tác nhanh</Text>
        {quickActions.map((a) => (
          <QuickActionCard key={a.id} {...a} />
        ))}
      </View>

      {/* Thống kê */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.brand600 }]}>Thống kê cá nhân</Text>
        <View style={styles.statsGrid}>
          <StatCard number="0" label="Lần sạc" />
          <StatCard number="0 kWh" label="Năng lượng" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', gap: 12 },
});
