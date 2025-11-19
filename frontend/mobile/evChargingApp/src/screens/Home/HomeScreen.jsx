import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync, fetchUserProfile } from '../../store/slices/authSlice';
import { getWallet } from '../../store/slices/walletSlice';
import useWallet from '../../hooks/useWallet';

import Header from '../../components/layout/Header';
import QuickActionCard from '../../components/cards/QuickActionCard';
import StatCard from '../../components/cards/StatCard';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Get user from Redux store
  const userProfile = useSelector((state) => state.auth.userProfile);
  const authLoading = useSelector((state) => state.auth.loading);
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Get wallet data from Redux store
  const { wallet, loading: walletLoading } = useSelector((state) => state.wallet);

  // Fetch user profile and wallet data
  useEffect(() => {
    if (accessToken && !userProfile) {
      dispatch(fetchUserProfile());
    }
  }, [accessToken, userProfile, dispatch]);

  useEffect(() => {
    if (userProfile?.user_id) {
      dispatch(getWallet(userProfile.user_id));
    }
  }, [userProfile, dispatch]);

  // Mock stats - TODO: fetch from analytics API
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
    {
      id: 'wallet',
      title: 'Ví của tôi',
      subtitle: walletLoading ? 'Đang tải...' : `${(wallet?.balance || 0).toLocaleString()} VND`,
      onPress: () => navigation.navigate('Wallet'),
    },
    { id: 'profile', title: 'Hồ sơ', subtitle: 'Quản lý thông tin cá nhân', onPress: () => navigation.navigate('Profile') },
  ];

  // Show loading state while fetching user profile
  if ((authLoading || (userProfile && walletLoading)) && !wallet) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
      <Header user={userProfile} />

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
