import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  useTheme,
  Text,
  Button,
  Divider,
  Snackbar,
} from 'react-native-paper';
import AppHeader from '../../components/common/AppHeader';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  getAvailablePlans,
  getSubscriptions,

  cancelSubscription,
  clearError,
} from '../../store/slices/subscriptionSlice';
import PlanCard from '../../components/subscription/PlanCard';

const SubscriptionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const styles = getStyles(colors);


  // Redux state
  const { profile } = useSelector((state) => state.user);
  const {
    availablePlans,
    subscriptions,
    plansLoading,
    loading,
    plansError,
    subscriptionsError,
    error,
  } = useSelector((state) => state.subscriptions);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const userId = profile?.user_id || profile?.id;

  // Fetch data on mount
  useEffect(() => {
    if (userId) {
      dispatch(getAvailablePlans());
      dispatch(getSubscriptions(userId));
    }
  }, [dispatch, userId]);

  // Show error messages
  useEffect(() => {
    if (plansError) {
      setSnackbarMessage(plansError);
      setSnackbarVisible(true);
      dispatch(clearError());
    }
  }, [plansError, dispatch]);

  useEffect(() => {
    if (subscriptionsError) {
      setSnackbarMessage(subscriptionsError);
      setSnackbarVisible(true);
      dispatch(clearError());
    }
  }, [subscriptionsError, dispatch]);

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarVisible(true);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubscribe = (planId) => {
    const plan = availablePlans.find(p => p.id === planId);
    if (!plan) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin gói.');
      return;
    }

    navigation.navigate('Wallet', {
      screen: 'SepayTopUp',
      params: {
        amount: plan.price,
        description: `Thanh toán gói ${plan.name}`,
        metadata: {
          type: 'SUBSCRIPTION_PURCHASE',
          plan_id: plan.id,
          user_id: userId,
        },
      },
    });
  };

  // Handle cancel
  const handleCancel = useCallback(
    (subscriptionId) => {
      Alert.alert(
        'Hủy đăng ký',
        'Bạn có chắc chắn muốn hủy đăng ký gói này?',
        [
          { text: 'Không', style: 'cancel' },
          {
            text: 'Hủy đăng ký',
            style: 'destructive',
            onPress: () => {
              if (!userId) {
                Alert.alert('Lỗi', 'Không thể xác định người dùng');
                return;
              }
              dispatch(cancelSubscription({ userId, subscriptionId }))
                .unwrap()
                .then(() => {
                  setSnackbarMessage('Hủy đăng ký thành công!');
                  setSnackbarVisible(true);
                  // Refresh subscriptions
                  dispatch(getSubscriptions(userId));
                })
                .catch((err) => {
                  const message =
                    err?.message ||
                    err?.error ||
                    'Không thể hủy đăng ký. Vui lòng thử lại.';
                  Alert.alert('Lỗi', message);
                });
            },
          },
        ]
      );
    },
    [userId, dispatch]
  );

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getAvailablePlans()).unwrap(),
        userId ? dispatch(getSubscriptions(userId)).unwrap() : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
    setRefreshing(false);
  }, [dispatch, userId]);

  // Check if plan is subscribed
  const isSubscribedToPlan = (planId) => {
    return subscriptions?.some(
      (sub) =>
        sub.plan_id === planId &&
        (sub.status === 'active' || sub.status === 'ACTIVE')
    );
  };

  // Get subscription id for a given plan
  const getSubscriptionIdByPlan = (planId) => {
    const sub = subscriptions?.find(
      (s) =>
        s.plan_id === planId &&
        (s.status === 'active' || s.status === 'ACTIVE')
    );
    return sub?.subscription_id || sub?.id;
  };

  // Render loading state
  if (plansLoading && !availablePlans.length) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải gói đăng ký...</Text>
      </SafeAreaView>
    );
  }

  // Render empty state
  if (!availablePlans || availablePlans.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'bottom']}>
        <MaterialCommunityIcons
          name="package-variant"
          size={64}
          color={colors.outlineVariant}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.emptyText}>Không có gói đăng ký nào</Text>
        <Button
          mode="contained"
          onPress={onRefresh}
          style={{ marginTop: 16 }}
        >
          Tải lại
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="Gói đăng ký" onBack={() => navigation.goBack()} />
      <FlatList
        data={availablePlans}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            isActive={isSubscribedToPlan(item.id)}
            onSubscribe={() => handleSubscribe(item.id)}
            onCancel={() => {
              const subId = getSubscriptionIdByPlan(item.id);
              if (!subId) {
                Alert.alert('Lỗi', 'Không tìm thấy đăng ký để hủy.');
                return;
              }
              handleCancel(subId);
            }}
            loading={loading}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              Danh sách gói
            </Text>
            {subscriptions && subscriptions.length > 0 && (
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Bạn đang có {subscriptions.length} gói hoạt động
              </Text>
            )}
            <Divider style={styles.divider} />
          </View>
        }
      />

      {/* Snackbar for messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'Đóng' }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      color: colors.onSurfaceVariant,
    },
    emptyText: {
      color: colors.onSurfaceVariant,
      fontSize: 16,
      textAlign: 'center',
    },
    listContent: {
      paddingVertical: 12,
    },
    headerSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      color: colors.onSurface,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    headerSubtitle: {
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },
    divider: {
      marginVertical: 8,
    },
  });

export default SubscriptionScreen;

