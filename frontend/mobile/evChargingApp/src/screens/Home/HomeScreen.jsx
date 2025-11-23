import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { FEATURES } from '../../config/featureFlags';

import { getMe } from '../../store/slices/userSlice';
import { getWallet } from '../../store/slices/walletSlice';
import { getNotifications } from '../../store/slices/notificationSlice';


import Header from '../../components/layout/Header';
import QuickActionCard from '../../components/cards/QuickActionCard';
import StatCard from '../../components/cards/StatCard';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Get user from Redux store
  const userProfile = useSelector((state) => state.user.profile);
  const authUserProfile = useSelector((state) => state.auth.userProfile);
  const authLoading = useSelector((state) => state.user.loading);
  const accessToken = useSelector((state) => state.auth.accessToken);

  // Get wallet data from Redux store
  const { wallet, loading: walletLoading } = useSelector((state) => state.wallet);
  const { unreadCount } = useSelector((state) => state.notification || { unreadCount: 0 });

  // Debug: Log user profile data
  console.log('==== HomeScreen User Data ====');
  console.log('state.user.profile:', JSON.stringify(userProfile, null, 2));
  console.log('state.auth.userProfile:', JSON.stringify(authUserProfile, null, 2));

  // Fetch user profile and wallet data
  useEffect(() => {
    if (accessToken && !userProfile) {
      console.log('Fetching user profile via getMe()');
      dispatch(getMe());
    }
  }, [accessToken, userProfile, dispatch]);

  useEffect(() => {
    if (userProfile?.user_id) {
      dispatch(getWallet(userProfile.user_id));
      // fetch notifications to update badge
      dispatch(getNotifications(userProfile.user_id));
    }
  }, [userProfile, dispatch]);

  // Mock stats - TODO: fetch from analytics API
  // Quick actions
  const quickActions = [
    { id: 'find-station', title: 'Tìm trạm sạc', subtitle: 'Tìm trạm sạc gần nhất', onPress: () => navigation.navigate('Map') },
    { id: 'notifications', title: 'Thông báo', subtitle: 'Tin mới từ hệ thống', onPress: () => navigation.navigate('Notification'), badgeCount: unreadCount },
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

      {/* Thống kê (ẩn bằng feature flag khi analytics-service chưa sẵn) */}
      {FEATURES.analytics && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.brand600 }]}>Thống kê cá nhân</Text>
          <View style={styles.statsGrid}>
            <StatCard number={stats.totalCharges.toString()} label="Lần sạc" />
            <StatCard number={`${stats.totalEnergy} kWh`} label="Năng lượng" />
          </View>
        </View>
      )}
          </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', gap: 12 },
});
