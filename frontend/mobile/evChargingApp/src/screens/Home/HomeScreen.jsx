import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';

import { getMe } from '../../store/slices/userSlice';
import { getWallet } from '../../store/slices/walletSlice';
import { getNotifications } from '../../store/slices/notificationSlice';
import useChargingHistory from '../../hooks/useChargingHistory';
import useWalletTransactions from '../../hooks/useWalletTransactions';
import useRefetchOnFocus from '../../hooks/useRefetchOnFocus';
import { timeAgo } from '../../utils/dateUtils';

// New modern components
import HeroSection from '../../components/home/HeroSection';
import FeatureCard from '../../components/home/FeatureCard';
import QuickAccessGrid from '../../components/home/QuickAccessGrid';
import PromoBanner from '../../components/home/PromoBanner';
import RecentActivityCard from '../../components/home/RecentActivityCard';
import StatsOverview from '../../components/home/StatsOverview';

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

  // Feature cards with gradient colors
  const featureCards = [
    {
      icon: 'ev-station',
      title: 'Trạm sạc',
      subtitle: 'Tìm và đặt chỗ tại trạm sạc gần bạn',
      gradientColors: [colors.brand500],
      onPress: () => navigation.navigate('Map'),
    },
    {
      icon: 'bell-ring',
      title: 'Thông báo',
      subtitle: 'Cập nhật mới nhất từ hệ thống',
      gradientColors: [colors.warning],
      badgeCount: unreadCount,
      onPress: () => navigation.navigate('Notification'),
    },
    {
      icon: 'history',
      title: 'Lịch sử sạc',
      subtitle: 'Xem chi tiết các lần sạc trước đây',
      gradientColors: [colors.success],
      onPress: () => navigation.navigate('History', { screen: 'ChargingHistory' }),
    },
  ];

  // Quick access grid items
  const quickAccessItems = [
    {
      icon: 'wallet',
      label: 'Ví',
      onPress: () => navigation.navigate('Wallet'),
      iconColor: colors.success,
      bgColor: colors.success + '20',
    },
    {
      icon: 'account',
      label: 'Hồ sơ',
      onPress: () => navigation.navigate('Profile'),
      iconColor: colors.primary,
      bgColor: colors.primary + '20',
    },
    {
      icon: 'car-electric',
      label: 'Xe của tôi',
      onPress: () => navigation.navigate('Profile', { screen: 'VehicleListScreen' }),
      iconColor: colors.warning,
      bgColor: colors.warning + '20',
    },
    {
      icon: 'credit-card',
      label: 'Thanh toán',
      onPress: () => navigation.navigate('Wallet', { screen: 'WalletMain' }),
      iconColor: colors.error,
      bgColor: colors.error + '20',
    },
    {
      icon: 'calendar-clock',
      label: 'Đặt chỗ',
      onPress: () => navigation.navigate('Map', { screen: 'MyBookingsScreen' }),
      iconColor: colors.brand300,
      bgColor: colors.brand300 + '20',
    },
    {
      icon: 'chart-line',
      label: 'Thống kê',
      onPress: () => navigation.navigate('History', { screen: 'ChargingHistory' }),
      iconColor: colors.success,
      bgColor: colors.success + '20',
    },
    {
      icon: 'gift',
      label: 'Ưu đãi',
      onPress: () => navigation.navigate('Profile', { screen: 'SubscriptionScreen' }),
      iconColor: colors.error,
      bgColor: colors.error + '20',
    },
    {
      icon: 'help-circle',
      label: 'Trợ giúp',
      onPress: () => {},
      iconColor: colors.warning,
      bgColor: colors.warning + '20',
    },
  ];

  // State for manual refresh
  const [refreshing, setRefreshing] = useState(false);

  // Real sessions and transactions - fetch on mount only
  const { sessions = [], fetchHistory: refetchSessions } = useChargingHistory({ autoFetch: true });
  const { transactions = [], fetchTransactions: refetchTransactions } = useWalletTransactions({ autoFetch: true, params: { limit: 10 } });

  // Refetch data when screen comes back into focus (but not on first mount)
  useRefetchOnFocus(
    useCallback(() => {
      if (userProfile?.user_id) {
        refetchSessions();
        refetchTransactions();
      }
    }, [userProfile, refetchSessions, refetchTransactions]),
    true
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refetch all necessary data
      await Promise.all([
        dispatch(getMe()),
        userProfile?.user_id ? dispatch(getWallet(userProfile.user_id)) : Promise.resolve(),
        userProfile?.user_id ? dispatch(getNotifications(userProfile.user_id)) : Promise.resolve(),
        refetchSessions(),
        refetchTransactions(),
      ]);
    } catch (error) {
      console.error('Failed to refresh home screen data:', error);
    }
    setRefreshing(false);
  }, [dispatch, userProfile, refetchSessions, refetchTransactions]);

  // Stats based on recent sessions (last 30 days)
  const statsData = (() => {
    if (!sessions || sessions.length === 0) return [];
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const recent = sessions.filter(s => {
      const t = new Date(s.end_time || s.completed_at || s.updated_at || s.created_at).getTime();
      return Number.isFinite(t) && now - t <= THIRTY_DAYS;
    });
    const totalCharges = recent.length;
    const totalEnergy = recent.reduce((sum, s) => sum + (Number(s.energy_consumed || s.energyConsumed) || 0), 0);
    const totalCost = recent.reduce((sum, s) => sum + (Number(s.cost || s.total_cost || s.totalCost) || 0), 0);
    const co2SavedKg = totalEnergy * 0.5; // approx factor

    return [
      { icon: 'lightning-bolt', value: String(totalCharges), label: 'Lần sạc', iconColor: colors.success, iconBg: colors.success + '20' },
      { icon: 'battery-charging-80', value: `${totalEnergy.toFixed(1)} kWh`, label: 'Năng lượng', iconColor: colors.primary, iconBg: colors.primary + '20' },
      { icon: 'cash', value: `${Math.round(totalCost).toLocaleString('vi-VN')} ₫`, label: 'Chi phí', iconColor: colors.warning, iconBg: colors.warning + '20' },
      { icon: 'leaf', value: `${co2SavedKg.toFixed(0)} kg`, label: 'CO₂ giảm', iconColor: colors.success, iconBg: colors.success + '20' },
    ];
  })();

  // Recent activities combined from charging sessions and wallet transactions
  const recentActivities = (() => {
    const sessionActs = (sessions || []).slice(0, 5).map(s => {
      const energy = Number(s.energy_consumed || s.energyConsumed) || 0;
      const stationName = s.station_name || s.stationName || 'Trạm sạc';
      const ts = new Date(s.end_time || s.completed_at || s.updated_at || s.created_at).getTime();
      return {
        icon: 'lightning-bolt',
        title: 'Sạc hoàn tất',
        subtitle: `${stationName} - ${energy.toFixed(1)} kWh`,
        time: timeAgo(ts),
        ts,
        iconBg: colors.success + '20',
        iconColor: colors.success,
      };
    });

    const txActs = (transactions || []).slice(0, 5).map(tx => {
      const isTopup = (tx.type || tx.transaction_type) === 'topup' || (tx.amount > 0 && (tx.direction === 'in'));
      const amount = Math.abs(Number(tx.amount || tx.total_amount) || 0).toLocaleString('vi-VN');
      const ts = new Date(tx.created_at || tx.timestamp || tx.date).getTime();
      return {
        icon: isTopup ? 'cash-plus' : 'cash-minus',
        title: isTopup ? 'Nạp tiền' : 'Thanh toán',
        subtitle: `${isTopup ? '+' : '-'}${amount} ₫`,
        time: timeAgo(ts),
        ts,
        iconBg: (isTopup ? colors.primary : colors.error) + '20',
        iconColor: isTopup ? colors.primary : colors.error,
      };
    });

    return [...sessionActs, ...txActs]
      .filter(a => Number.isFinite(a.ts))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 3)
      .map(({ ts, ...rest }) => rest);
  })();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {/* Hero Section with gradient */}
        <HeroSection
          user={userProfile}
          balance={wallet?.balance || 0}
          onFindStation={() => navigation.navigate('Map')}
        />

        {/* Feature Cards */}
        <View style={styles.section}>
          {featureCards.map((card, index) => (
            <FeatureCard key={index} {...card} />
          ))}
        </View>

        {/* Promo Banner */}
        <PromoBanner
          title="Ưu đãi đặc biệt!"
          description="Giảm 20% cho lần sạc tiếp theo khi nạp từ 500K"
          buttonText="Xem chi tiết"
          onPress={() => navigation.navigate('Profile', { screen: 'SubscriptionScreen' })}
          gradientColors={[colors.error]}
          icon="gift"
        />

        {/* Quick Access Grid */}
        <QuickAccessGrid items={quickAccessItems} />

        {/* Stats Overview */}
        {statsData.length > 0 && (
          <StatsOverview stats={statsData} />
        )}

        {/* Recent Activity */}
        <RecentActivityCard
          activities={recentActivities}
          onViewAll={() => navigation.navigate('History', { screen: 'ChargingHistory' })}
        />

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
