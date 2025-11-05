import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Alert, 
  TouchableOpacity, 
  Text,
  TextInput,
  FlatList,
  Platform
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample stations data - sẽ được thay thế bằng API call
  const sampleStations = [
    {
      id: 's1',
      name: 'Trạm sạc Central Park',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      latitude: 10.7629,
      longitude: 106.6601,
      available_ports: 3,
      total_ports: 4,
      price_per_kwh: 2000,
      connector_types: ['Type 2', 'CCS'],
      status: 'active',
      rating: 4.5,
      distance: 0.5
    },
    {
      id: 's2',
      name: 'Trạm sạc Landmark 81',
      address: '456 Vinhomes, Bình Thạnh, TP.HCM',
      latitude: 10.7946,
      longitude: 106.7218,
      available_ports: 1,
      total_ports: 6,
      price_per_kwh: 2200,
      connector_types: ['Type 2', 'CCS', 'CHAdeMO'],
      status: 'active',
      rating: 4.8,
      distance: 3.2
    },
    {
      id: 's3',
      name: 'Trạm sạc Vincom Đồng Khởi',
      address: '789 Đồng Khởi, Q1, TP.HCM',
      latitude: 10.7700,
      longitude: 106.7010,
      available_ports: 0,
      total_ports: 2,
      price_per_kwh: 1800,
      connector_types: ['Type 2'],
      status: 'maintenance',
      rating: 4.2,
      distance: 1.8
    },
  ];

  useEffect(() => {
    requestLocationPermission();
    loadStations();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        setLoading(false);
        Alert.alert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để hiển thị trạm sạc gần bạn.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserLocation({ latitude, longitude });
        setRegion(newRegion);
        setLoading(false);
        
        // Animate to user location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
        Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadStations = async () => {
    try {
      // TODO: Call station service API
      setStations(sampleStations);
    } catch (error) {
      console.error('Error loading stations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách trạm sạc');
    }
  };

  const onMarkerPress = (station) => {
    setSelectedStation(station);
    
    // Animate to station location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getMarkerColor = (station) => {
    if (station.status === 'maintenance') return '#F44336';
    if (station.available_ports === 0) return '#FF9800';
    return '#4CAF50';
  };

  const handleBookStation = () => {
    if (selectedStation) {
      navigation.navigate('ScheduleBooking', { 
        stationId: selectedStation.id,
        station: selectedStation 
      });
    }
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={null} // null = use default (Apple Maps on iOS, Google Maps on Android without API key)
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={() => setSelectedStation(null)}
      >
        {stations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            title={station.name}
            description={`${station.available_ports}/${station.total_ports} cổng sạc có sẵn`}
            pinColor={getMarkerColor(station)}
            onPress={() => onMarkerPress(station)}
          />
        ))}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.searchBox}
          onPress={() => setShowSearch(true)}
        >
          <Icon name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>
            {searchQuery || 'Tìm trạm sạc...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={getCurrentLocation}
      >
        <Icon name="my-location" size={24} color="#2196F3" />
      </TouchableOpacity>

      {/* Station Info Card */}
      {selectedStation && (
        <View style={styles.stationCard}>
          <View style={styles.stationHeader}>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>{selectedStation.name}</Text>
              <Text style={styles.stationAddress}>{selectedStation.address}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedStation(null)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.stationDetails}>
            <View style={styles.detailRow}>
              <Icon name="power" size={16} color="#666" />
              <Text style={styles.detailText}>
                {selectedStation.available_ports}/{selectedStation.total_ports} cổng sạc
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="attach-money" size={16} color="#666" />
              <Text style={styles.detailText}>
                {selectedStation.price_per_kwh.toLocaleString()} VND/kWh
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="star" size={16} color="#FF9800" />
              <Text style={styles.detailText}>
                {selectedStation.rating} • {selectedStation.distance} km
              </Text>
            </View>
          </View>

          <View style={styles.connectorTypes}>
            {selectedStation.connector_types.map((type, index) => (
              <View key={index} style={styles.connectorBadge}>
                <Text style={styles.connectorText}>{type}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[
              styles.bookButton,
              selectedStation.available_ports === 0 && styles.disabledButton
            ]}
            onPress={handleBookStation}
            disabled={selectedStation.available_ports === 0}
          >
            <Text style={styles.bookButtonText}>
              {selectedStation.available_ports === 0 ? 'Hết chỗ' : 'Đặt chỗ sạc'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Modal */}
      {showSearch && (
        <View style={styles.searchModal}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm trạm sạc..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredStations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => {
                  setShowSearch(false);
                  onMarkerPress(item);
                }}
              >
                <View>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultAddress}>{item.address}</Text>
                </View>
                <Text style={styles.resultDistance}>{item.distance} km</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  map: { 
    width: "100%", 
    height: "100%" 
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#666',
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: '#666',
  },
  stationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  connectorTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  connectorBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectorText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchModal: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
  },
  resultDistance: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
});
