import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, List, Button, ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from '../../store/slices/userSlice';
import { UserRole } from '../../config/roles';
import { logoutAsync } from '../../store/slices/authSlice';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import AnimatedListItem from '../../components/common/AnimatedListItem';
import EnhancedRefreshControl from '../../components/common/EnhancedRefreshControl';
import ProfileHeader from '../../components/profile/ProfileHeader';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' }, // iOS-like grouped table view background
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F2F2F7' },
  errorText: { color: colors.error, marginBottom: 16, textAlign: 'center' },
  // Header
  headerContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { marginBottom: 12 },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.onSurface, marginBottom: 4 },
  userEmail: { fontSize: 16, color: colors.onSurfaceVariant },
  // List Sections
  section: { marginTop: 24 },
  sectionHeader: { fontSize: 13, color: colors.onSurfaceVariant, marginLeft: 16, marginBottom: 8, textTransform: 'uppercase' },
  listSection: { backgroundColor: colors.surface, borderRadius: 10, marginHorizontal: 16, overflow: 'hidden' },
  logoutItem: { justifyContent: 'center', alignItems: 'center', height: 50 },
  logoutText: { color: colors.error, fontSize: 16 },
});

const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getMe());
    setRefreshing(false);
  }, [dispatch]);

  // Initial fetch if profile does not exist
  useEffect(() => {
    if (!profile) {
      dispatch(getMe());
    }
  }, [profile, dispatch]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', onPress: () => dispatch(logoutAsync()), style: 'destructive' },
    ]);
  };

  if (loading) {
    return <View style={styles.centeredContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!loading && (!profile || error)) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || 'Không tải được thông tin người dùng'}</Text>
        <Button mode="contained" onPress={() => dispatch(getMe())}>Thử lại</Button>
      </View>
    );
  }

  const user = profile;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {/* Profile Header */}
        <View style={styles.headerContainer}>
          <Avatar.Image
            size={90}
            source={{ uri: user?.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(user?.full_name || 'User')}` }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.full_name || 'User Name'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.listSection}>
            <List.Item
              title="Chỉnh sửa thông tin"
              left={(props) => <List.Icon {...props} icon="account-edit-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <List.Item
              title="Đổi mật khẩu"
              left={(props) => <List.Icon {...props} icon="lock-reset" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('ChangePasswordScreen')}
            />
          </View>
        </View>

        {/* App Usage Section */}
        <View style={styles.section}>
          <View style={styles.listSection}>
            <List.Item
              title="Lịch sử sạc"
              left={(props) => <List.Icon {...props} icon="history" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('History')}
            />
            <List.Item
              title="Quản lý phương tiện"
              left={(props) => <List.Icon {...props} icon="car-multiple" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('VehicleListScreen')}
            />
            <List.Item
              title="Quản lý đăng ký"
              description="Xem và quản lý các gói đăng ký của bạn"
              left={(props) => <List.Icon {...props} icon="credit-card-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('SubscriptionScreen')}
            />
          </View>
        </View>

        {/* Admin Section */}
        {user?.role === UserRole.ADMIN && (
          <View style={styles.section}>
            <View style={styles.listSection}>
              <List.Item
                title="Admin Dashboard"
                left={(props) => <List.Icon {...props} icon="view-dashboard-outline" color={colors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('AdminDashboardScreen')}
                titleStyle={{ color: colors.primary, fontWeight: 'bold' }}
              />
            </View>
          </View>
        )}

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.listSection}>
            <TouchableOpacity onPress={handleLogout}>
              <View style={styles.logoutItem}>
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

