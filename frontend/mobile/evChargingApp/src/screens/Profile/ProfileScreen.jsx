import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Avatar, Title, Caption, List, Divider, Button, ActivityIndicator, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from '../../store/slices/userSlice';
import { logout } from '../../store/slices/authSlice';
import { theme } from '../../config/theme';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth.user);

  useFocusEffect(
    useCallback(() => {
      // Fetch user profile when the screen is focused
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
            dispatch(logout());
            // Reset navigation to Auth stack
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          },
          style: 'destructive'
        },
      ]
    );
  };

  if (loading && !profile) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={() => dispatch(getMe())}>Thử lại</Button>
      </View>
    );
  }

  const user = profile || authUser;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <Avatar.Image
          size={80}
          source={{ uri: user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}` }}
          style={styles.avatar}
        />
        <Title style={styles.userName}>{user?.full_name || 'User Name'}</Title>
        <Caption style={styles.userEmail}>{user?.email}</Caption>
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
          onPress={() => navigation.navigate('VehicleManagement')}
        />
        <List.Item
          title="Đổi mật khẩu"
          description="Thay đổi mật khẩu đăng nhập"
          left={(props) => <List.Icon {...props} icon="lock-reset" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <List.Item
          title="Lịch sử sạc"
          description="Xem lại các phiên sạc của bạn"
          left={(props) => <List.Icon {...props} icon="history" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('ChargingHistory')}
        />
        <List.Item
          title="Cài đặt thông báo"
          description="Quản lý các loại thông báo bạn nhận được"
          left={(props) => <List.Icon {...props} icon="bell-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
      </List.Section>

      <Divider />

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          color={theme.colors.error}
          style={styles.logoutButton}
          labelStyle={styles.logoutLabel}
        >
          Đăng xuất
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.onSurface + '80',
  },
  logoutContainer: {
    padding: 24,
  },
  logoutButton: {
    borderRadius: 8,
  },
  logoutLabel: {
    fontWeight: 'bold',
  },
});