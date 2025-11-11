import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Button, ActivityIndicator, Text, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getVehicles } from '../../store/slices/vehicleSlice';
import VehicleCard from '../../components/profile/VehicleCard'; // This component will be created next
import { useTheme } from 'react-native-paper';

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
      onPress={() => navigation.navigate('EditVehicleScreen', { vehicleId: item.id })}
    />
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={colors.primary} />
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
    </View>
  );
}


