import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useChargingHistory from '../../hooks/useChargingHistory';
import SessionCard from '../../components/charging/SessionCard';
import { useTheme } from 'react-native-paper';

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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const renderItem = ({ item }) => (
    <SessionCard
      session={item}
      onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id || item.session_id })}
    />
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>
          Đang tải lịch sử sạc...
        </Text>
      </View>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

export default ChargingHistoryScreen;

