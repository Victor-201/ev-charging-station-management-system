import React from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../../store/slices/authSlice';

import Header from '../../components/layout/Header';
import QuickActionCard from '../../components/cards/QuickActionCard';
import StatCard from '../../components/cards/StatCard';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const realUser = useSelector((state) => state.auth.user);

  // Use the wallet hook (auto-fetches the wallet using the mock service)
  
  // Mock data for frontend development without backend
  const mockUser = {
    info: {
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    },
  };
  
  const user = realUser || mockUser;
  
  const stats = {
    totalCharges: 15,
    totalEnergy: 350,
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          dispatch(logoutAsync());
        },
      },
    ]);
  };

  const quickActions = [
    { id: 'find-station', title: 'Tìm trạm sạc', subtitle: 'Tìm trạm sạc gần nhất', onPress: () => navigation.navigate('Map') },
    { id: 'charging-history', title: 'Lịch sử sạc', subtitle: 'Xem lịch sử sạc xe', onPress: () => navigation.navigate('Charging', { screen: 'ChargingHistory' }) },
    { id: 'wallet', title: 'Ví của tôi', subtitle: 'Quản lý số dư và giao dịch', onPress: () => navigation.navigate('Wallet') },
    { id: 'profile', title: 'Hồ sơ', subtitle: 'Quản lý thông tin cá nhân', onPress: () => navigation.navigate('Profile') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
      <Header user={user} />

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
          <StatCard number={stats.totalCharges.toString()} label="Lần sạc" />
          <StatCard number={`${stats.totalEnergy} kWh`} label="Năng lượng" />
        </View>
      </View>
          </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', gap: 12 },
});
