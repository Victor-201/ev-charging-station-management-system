import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getUsers, clearError } from '../../store/slices/userSlice'; // Assuming getUsers action exists

const AdminDashboardScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.user);

  const loadUsers = useCallback(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Fix: Wrap in useCallback to prevent continuous calls
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} />;
    }

    if (error) {
      return (
        <>
          <Icon name="error-outline" size={64} color={colors.error} style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>Không thể tải danh sách người dùng</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <Text style={styles.maintenanceText}>
            Chức năng này có thể đang được bảo trì. Vui lòng thử lại sau.
          </Text>
          <Button mode="contained" onPress={loadUsers} style={{ marginTop: 16 }}>
            Thử lại
          </Button>
        </>
      );
    }

    // This part will be rendered if the API succeeds in the future
    return <Text>User list would be displayed here. Found {users.length} users.</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.centered}>
        <Text style={styles.title}>Quản lý người dùng</Text>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: colors.onSurface,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
  },
  errorSubText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
  },
  maintenanceText: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AdminDashboardScreen;

