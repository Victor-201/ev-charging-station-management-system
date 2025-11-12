import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, List, Divider, Button, ActivityIndicator, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from '../../store/slices/userSlice';
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
      paddingVertical: 24,
      backgroundColor: colors.surface,
    },
    avatar: {
      marginBottom: 12,
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
        </View>

        <Divider />

        {/* Menu List */}
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
        </List.Section>

        <Divider />

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
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
