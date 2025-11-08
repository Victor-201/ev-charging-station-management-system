import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getChargingHistory } from '../../store/slices/chargingSlice'; // This will be created later
import SessionCard from '../../components/charging/SessionCard'; // This will be created next
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
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    color: colors.onSurface,
    opacity: 0.7,
  }
});

const ChargingHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sessions, loading, error } = useSelector((state) => state.charging);

  const loadHistory = useCallback(() => {
    if (user?.id) {
      dispatch(getChargingHistory(user.id));
    }
  }, [dispatch, user?.id]);

  useFocusEffect(loadHistory);

  const renderItem = ({ item }) => (
    <SessionCard
      session={item}
      onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
    />
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadHistory}>Thử lại</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {sessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Bạn chưa có lịch sử sạc nào.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadHistory}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

export default ChargingHistoryScreen;

