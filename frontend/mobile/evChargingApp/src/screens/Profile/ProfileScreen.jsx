import { useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, List, Button, ActivityIndicator, Text, useTheme, Card } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMe } from '../../store/slices/userSlice';
import { UserRole } from '../../config/roles';
import { logoutAsync } from '../../store/slices/authSlice';
import { getAvatarData } from '../../utils/avatarUtils';
import useSubscriptions from '../../hooks/useSubscriptions';

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, // Use theme background
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background },
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
  // Subscription Section
  subscriptionContent: { paddingVertical: 12 },
  subscriptionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subscriptionTitle: { color: colors.onSurface, fontWeight: 'bold' },
  subscriptionSubtitle: { color: colors.onSurfaceVariant, marginTop: 2 },
  subscriptionDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 36 },
  subscriptionDetailText: { color: colors.onSurfaceVariant },
  subscriptionButton: { marginTop: 8, borderColor: colors.primary },
});

const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  // Get subscription data
  const userId = profile?.user_id || profile?.id;
  const { getActiveSubscription } = useSubscriptions({
    userId,
    autoFetch: true,
  });
  const activeSubscription = getActiveSubscription();

  // Move useMemo before any early returns to fix hooks order
  const { initials: avatarInitials, backgroundColor: avatarBg, textColor: avatarText } = useMemo(
    () => getAvatarData(profile?.full_name || 'User', colors),
    [profile?.full_name, colors]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(getMe());
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
          {user?.avatar_url ? (
            <Avatar.Image
              size={90}
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={90}
              label={avatarInitials}
              style={[styles.avatar, { backgroundColor: avatarBg }]}
              color={avatarText}
            />
          )}
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

        {/* Subscription Status Section */}
        {activeSubscription && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Gói đăng ký hiện tại</Text>
            <Card style={[styles.listSection, { marginHorizontal: 16 }]}>
              <Card.Content style={styles.subscriptionContent}>
                <View style={styles.subscriptionHeader}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.success}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={styles.subscriptionTitle}>
                      Đang sử dụng
                    </Text>
                    <Text variant="bodySmall" style={styles.subscriptionSubtitle}>
                      Gói: {activeSubscription.plan_id}
                    </Text>
                  </View>
                </View>
                {activeSubscription.end_date && (
                  <View style={styles.subscriptionDetail}>
                    <MaterialCommunityIcons
                      name="calendar-end"
                      size={16}
                      color={colors.onSurfaceVariant}
                      style={{ marginRight: 8 }}
                    />
                    <Text variant="bodySmall" style={styles.subscriptionDetailText}>
                      Hết hạn: {new Date(activeSubscription.end_date).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                )}
                <Button
                  mode="outlined"
                  icon="pencil"
                  onPress={() => navigation.navigate('Subscription')}
                  style={styles.subscriptionButton}
                  size="small"
                >
                  Quản lý gói
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}

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
              title="Quản lý gói đăng ký"
              description="Xem và quản lý các gói đăng ký của bạn"
              left={(props) => <List.Icon {...props} icon="credit-card-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Subscription')}
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

