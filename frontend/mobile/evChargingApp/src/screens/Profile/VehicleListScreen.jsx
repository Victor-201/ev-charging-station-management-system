import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ActivityIndicator, Text, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import useVehicles from '../../hooks/useVehicles';
import VehicleCard from '../../components/profile/VehicleCard';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
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
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
    color: colors.onSurface + '80',
  },
  listContainer: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

export default function VehicleListScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { vehicles, loading, error, fetchVehicles } = useVehicles();

  useFocusEffect(
    useCallback(() => {
      fetchVehicles().catch(err => {
        console.error('Failed to fetch vehicles:', err);
      });
    }, [fetchVehicles])
  );

  const renderItem = ({ item }) => (
    <VehicleCard 
      vehicle={item} 
      onPress={() => navigation.navigate('EditVehicleScreen', { vehicleId: item.id })}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator animating={true} size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => fetchVehicles()}>Thử lại</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {vehicles.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Bạn chưa có phương tiện nào.</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddVehicleScreen')}
          >
            Thêm phương tiện mới
          </Button>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddVehicleScreen')}
      />
    </SafeAreaView>
  );
}


