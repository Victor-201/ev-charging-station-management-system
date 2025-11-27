import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, LayoutAnimation, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useChargingHistory from '../../hooks/useChargingHistory';
import SessionCard from '../../components/charging/SessionCard';
import AnimatedListItem from '../../components/common/AnimatedListItem';
import EnhancedRefreshControl from '../../components/common/EnhancedRefreshControl';
import { SkeletonList } from '../../components/common/SkeletonLoader';
import { useTheme } from 'react-native-paper';
import { LayoutAnimations } from '../../utils/animations';

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
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

const ChargingHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    sessions,
    loading,
    error,
    refreshing,
    fetchHistory,
    refresh,
  } = useChargingHistory({ autoFetch: true });

  // Animate list when data changes (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios' && sessions.length > 0 && !loading) {
      LayoutAnimation.configureNext(LayoutAnimations.spring);
    }
  }, [sessions.length, loading]);

  // Refresh data when screen comes into focus
  // Only refetch if we have sessions already (avoid duplicate calls on first mount)
  useFocusEffect(
    useCallback(() => {
      if (sessions && sessions.length > 0) {
        fetchHistory();
      }
    }, [fetchHistory, sessions])
  );

  const renderItem = ({ item, index }) => (
    <AnimatedListItem
      index={index}
      delay={0}
      staggerDelay={50}
    >
      <SessionCard
        session={item}
        onPress={() => navigation.navigate('SessionDetail', { session: item })}
      />
    </AnimatedListItem>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={80} color={colors.onSurfaceVariant} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Chưa có lịch sử sạc</Text>
      <Text style={styles.emptySubtext}>
        Lịch sử các phiên sạc của bạn sẽ hiển thị ở đây
      </Text>
    </View>
  );

  if (loading && !refreshing && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonList count={5} />
      </SafeAreaView>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <Icon name="error-outline" size={64} color={colors.error} style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={refresh}>
          Thử lại
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => (item.id || item.session_id || Math.random()).toString()}
        contentContainerStyle={sessions.length === 0 ? { flex: 1 } : styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <EnhancedRefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            enableHaptic={true}
          />
        }
      />
    </SafeAreaView>
  );
};

export default ChargingHistoryScreen;

