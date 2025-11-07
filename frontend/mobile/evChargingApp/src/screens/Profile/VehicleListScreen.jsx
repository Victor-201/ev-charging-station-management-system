import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Button, ActivityIndicator, Text, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getVehicles } from '../../store/slices/vehicleSlice';
import VehicleCard from '../../components/profile/VehicleCard'; // This component will be created next
import { theme } from '../../config/theme';

export default function VehicleListScreen({ navigation }) {
  const dispatch = useDispatch();
  const { vehicles, loading, error } = useSelector((state) => state.vehicles);
  const { user } = useSelector((state) => state.auth);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        dispatch(getVehicles(user.id));
      }
    }, [dispatch, user?.id])
  );

  const renderItem = ({ item }) => (
    <VehicleCard 
      vehicle={item} 
      onPress={() => navigation.navigate('EditVehicle', { vehicleId: item.id })}
    />
  );

  if (loading) {
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
        <Button onPress={() => dispatch(getVehicles(user.id))}>Thử lại</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Bạn chưa có phương tiện nào.</Text>
          <Button 
            mode="contained"
            onPress={() => navigation.navigate('AddVehicle')}
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
        onPress={() => navigation.navigate('AddVehicle')}
      />
    </View>
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
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
    color: theme.colors.onSurface + '80',
  },
  listContainer: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
