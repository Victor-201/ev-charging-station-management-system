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
      gradientColors: ['#002682', '#0052CC'],
      onPress: () => navigation.navigate('Map'),
    },
    {
      icon: 'bell-ring',
      title: 'Thông báo',
      subtitle: 'Cập nhật mới nhất từ hệ thống',
      gradientColors: ['#f2ae14', '#ff9500'],
      badgeCount: unreadCount,
      onPress: () => navigation.navigate('Notification'),
    },
    {
      icon: 'history',
      title: 'Lịch sử sạc',
      subtitle: 'Xem chi tiết các lần sạc trước đây',
      gradientColors: ['#86df20', '#5cb300'],
      onPress: () => navigation.navigate('Charging', { screen: 'ChargingHistory' }),
    },
  ];

  // Quick access grid items
  const quickAccessItems = [
    {
      icon: 'wallet',
      label: 'Ví',
      onPress: () => navigation.navigate('Wallet'),
      iconColor: '#86df20',
      bgColor: '#86df2020',
    },
    {
      icon: 'account',
      label: 'Hồ sơ',
      onPress: () => navigation.navigate('Profile'),
      iconColor: '#002682',
      bgColor: '#00268220',
    },
    {
      icon: 'car-electric',
      label: 'Xe của tôi',
      onPress: () => navigation.navigate('Profile', { screen: 'VehicleListScreen' }),
      iconColor: '#f2ae14',
      bgColor: '#f2ae1420',
    },
    {
      icon: 'credit-card',
      label: 'Thanh toán',
      onPress: () => navigation.navigate('Wallet', { screen: 'PaymentMethods' }),
      iconColor: '#f60d01',
      bgColor: '#f60d0120',
    },
    {
      icon: 'calendar-clock',
      label: 'Đặt chỗ',
      onPress: () => navigation.navigate('Charging', { screen: 'ReservationStack' }),
      iconColor: '#0052CC',
      bgColor: '#0052CC20',
    },
    {
      icon: 'chart-line',
      label: 'Thống kê',
      onPress: () => navigation.navigate('Charging', { screen: 'ChargingHistory' }),
      iconColor: '#86df20',
      bgColor: '#86df2020',
    },
    {
      icon: 'gift',
      label: 'Ưu đãi',
      onPress: () => navigation.navigate('Profile', { screen: 'SubscriptionScreen' }),
      iconColor: '#f60d01',
      bgColor: '#f60d0120',
    },
    {
      icon: 'help-circle',
      label: 'Trợ giúp',
      onPress: () => {},
      iconColor: '#f2ae14',
      bgColor: '#f2ae1420',
    },
  ];

  // Stats data
  const statsData = [
    {
      icon: 'lightning-bolt',
      value: '24',
      label: 'Lần sạc',
      trend: 12,
      iconColor: '#86df20',
      iconBg: '#86df2020',
    },
    {
      icon: 'battery-charging-80',
      value: '156 kWh',
      label: 'Năng lượng',
      trend: 8,
      iconColor: '#002682',
      iconBg: '#00268220',
    },
    {
      icon: 'cash',
      value: '2.4M',
      label: 'Tiết kiệm',
      trend: 15,
      iconColor: '#86df20',
      iconBg: '#86df2020',
    },
    {
      icon: 'leaf',
      value: '89 kg',
      label: 'CO₂ giảm',
      trend: 10,
      iconColor: '#5cb300',
      iconBg: '#5cb30020',
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      icon: 'lightning-bolt',
      title: 'Sạc hoàn tất',
      subtitle: 'Trạm Vincom Center - 45 kWh',
      time: '2h trước',
      iconBg: '#86df2020',
      iconColor: '#86df20',
    },
    {
      icon: 'cash-plus',
      title: 'Nạp tiền',
      subtitle: '+500,000 VND',
      time: '1 ngày',
      iconBg: '#00268220',
      iconColor: '#002682',
    },
    {
      icon: 'calendar-check',
      title: 'Đặt chỗ thành công',
      subtitle: 'Trạm Landmark 81 - 15:00',
      time: '2 ngày',
      iconBg: '#f2ae1420',
      iconColor: '#f2ae14',
    },
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          gradientColors={['#f60d01', '#ff4757']}
          icon="gift"
        />

        {/* Quick Access Grid */}
        <QuickAccessGrid items={quickAccessItems} />

        {/* Stats Overview */}
        {FEATURES.analytics && (
          <StatsOverview stats={statsData} />
        )}

        {/* Recent Activity */}
        <RecentActivityCard
          activities={recentActivities}
          onViewAll={() => navigation.navigate('Charging', { screen: 'ChargingHistory' })}
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
