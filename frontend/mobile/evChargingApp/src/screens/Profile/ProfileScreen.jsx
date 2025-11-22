import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, List, Divider, Button, ActivityIndicator, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from '../../store/slices/userSlice';
import { UserRole } from '../../config/roles';
import { logoutAsync } from '../../store/slices/authSlice';
import { useTheme } from 'react-native-paper';

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    errorText: {
      color: colors.error,
      marginBottom: 16,
      textAlign: 'center',
    },
    headerContainer: {
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: colors.surface,
    },
    avatar: {
      marginBottom: 8,
    },
    userName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    userEmail: {
      fontSize: 16,
      color: colors.onSurface + '80',
    },
    verificationBadge: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
    },
    verificationText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    infoSection: {
      backgroundColor: colors.surface,
      padding: 16,
      marginVertical: 8,
    },
    infoRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.onSurface + '10',
    },
    infoLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    infoValue: {
      flex: 2,
      fontSize: 14,
      color: colors.onSurface,
      fontWeight: '400',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    logoutContainer: {
      padding: 24,
      backgroundColor: colors.surface,
    },
    logoutButton: {
      borderRadius: 8,
    },
    logoutLabel: {
      fontWeight: 'bold',
      color: colors.onPrimary,
    },
  });

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.user);

  // Fetch profile when screen focused
  useFocusEffect(
    useCallback(() => {
      dispatch(getMe());
    }, [dispatch])
  );

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          onPress: () => {
            dispatch(logoutAsync());
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={colors.primary} />
      </View>
    );
  }

  // Error state
  if (!loading && (!profile || error)) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || 'Không tải được thông tin người dùng'}</Text>
        <Button mode="contained" onPress={() => dispatch(getMe())}>
          Thử lại
        </Button>
      </View>
    );
  }

  // Profile loaded
  const user = profile;

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Profile Header */}
        <View style={styles.headerContainer}>
          <Avatar.Image
            size={80}
            source={{
              uri:
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.full_name || 'User Name'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Email Verification Badge */}
          {user?.email_verified !== undefined && (
            <View style={[
              styles.verificationBadge,
              { backgroundColor: user.email_verified ? colors.success : colors.warning }
            ]}>
              <Text style={styles.verificationText}>
                {user.email_verified ? '✓ Email đã xác thực' : '⚠ Email chưa xác thực'}
              </Text>
            </View>
          )}
        </View>

        <Divider />

        {/* User Information Section */}
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ tên:</Text>
            <Text style={styles.infoValue}>{user?.full_name || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Chưa cập nhật'}</Text>
          </View>
          {user?.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              <Text style={styles.infoValue}>{user.address}</Text>
            </View>
          )}
          {user?.date_of_birth && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày sinh:</Text>
              <Text style={styles.infoValue}>
                {new Date(user.date_of_birth).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}
        </View>

        <Divider />

        {/* Menu List */}
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        <List.Section>
          <List.Item
            title="Chỉnh sửa thông tin"
            description="Thay đổi thông tin cá nhân của bạn"
            left={(props) => <List.Icon {...props} icon="account-edit-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <List.Item
            title="Quản lý phương tiện"
            description="Thêm hoặc xóa các phương tiện của bạn"
            left={(props) => <List.Icon {...props} icon="car-multiple" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('VehicleListScreen')}
          />
          <List.Item
            title="Đổi mật khẩu"
            description="Thay đổi mật khẩu đăng nhập"
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePasswordScreen')}
          />
          <List.Item
            title="Lịch sử sạc"
            description="Xem lại các phiên sạc của bạn"
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('History')}
          />
          <List.Item
            title="Quản lý đăng ký"
            description="Xem và quản lý các gói đăng ký của bạn"
            left={(props) => <List.Icon {...props} icon="credit-card-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('SubscriptionScreen')}
          />
          <List.Item
            title="Tài khoản và Bảo mật"
            description="Quản lý dữ liệu và xóa tài khoản"
            left={(props) => <List.Icon {...props} icon="shield-account-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('AccountSettingsScreen')}
          />

          {/* Admin-only section */}
          {user?.role === UserRole.ADMIN && (
            <List.Item
              title="Admin Dashboard"
              description="Quản lý hệ thống"
              left={(props) => <List.Icon {...props} icon="view-dashboard-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('AdminDashboardScreen')}
              titleStyle={{ color: colors.primary }}
            />
          )}
        </List.Section>

        <Divider />

        {/* Logout Button */}
        <View style={[styles.logoutContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
          <Button
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            labelStyle={styles.logoutLabel}
          >
            Đăng xuất
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
