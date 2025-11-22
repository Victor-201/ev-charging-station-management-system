import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
  Platform,
  Linking,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import WebView from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { searchStations, setSelectedStation } from '../../store/slices/stationSlice';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: colors.onSurface,
    opacity: 0.6,
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: 260,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 12,
    elevation: 4,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  listButton: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 12,
    elevation: 4,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: colors.onBackground,
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
  stationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.brand50,
  },
  detailsButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
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
    color: colors.onSurface,
    opacity: 0.7,
  },
  connectorTypes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  connectorBadge: {
    backgroundColor: colors.brand50,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectorText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.brand50,
    borderRadius: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  directionsButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.surfaceDisabled,
  },
  bookButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchModal: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    maxHeight: 400,
    elevation: 8,
    shadowColor: colors.onBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.onSurface,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurface,
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.7,
  },
  resultDistance: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
});

// Default location: 70 Tô Ký, Quận 12, TP.HCM
const DEFAULT_LOCATION = {
  latitude: 10.8543,
  longitude: 106.6296,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const { stations, selectedStation } = useSelector((state) => state.stations);

  const [region, setRegion] = useState(null); // Start with null region

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);



  useEffect(() => {
    requestLocationPermission();
  }, []);

  const handleRegionChangeComplete = (newRegion) => {
    if (!newRegion) return;
    const radius = Math.max(1, Math.round(newRegion.latitudeDelta * 111)); // Approx delta to km
    dispatch(searchStations({
      lat: newRegion.latitude,
      lng: newRegion.longitude,
      radius
    }));
  };

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        // Set default location to 70 Tô Ký if permission denied
        setRegion(DEFAULT_LOCATION);
        handleRegionChangeComplete(DEFAULT_LOCATION);
        Alert.alert(
          'Quyền truy cập vị trí',
          'Bạn đã từ chối quyền truy cập vị trí. Ứng dụng sẽ hiển thị các trạm sạc ở khu vực 70 Tô Ký.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
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
        setRegion(newRegion);

        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
        handleRegionChangeComplete(newRegion);
      },
      (error) => {
        console.error('Error getting location:', error);
        // Set default location to 70 Tô Ký if GPS fails
        setRegion(DEFAULT_LOCATION);
        handleRegionChangeComplete(DEFAULT_LOCATION);
        Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Hiển thị trạm sạc ở khu vực 70 Tô Ký.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const onMarkerPress = (station) => {
    dispatch(setSelectedStation(station));

    // Animate to station location (only if coordinates are valid)
    if (mapRef.current && station.latitude != null && station.longitude != null) {
      mapRef.current.animateToRegion({
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getMarkerColor = (station) => {
    if (station.status === 'maintenance' || station.status === 'offline') return colors.error;
    if ((station.available_ports || 0) === 0) return colors.warning;
    if ((station.available_ports || 0) > 0) return colors.success;
    return colors.primary; // Default color
  };

  const getAvailabilityText = (station) => {
    if (station.status === 'maintenance') return 'Bảo trì';
    if (station.status === 'offline') return 'Ngoại tuyến';
    if ((station.available_ports || 0) === 0) return 'Hết chỗ';
    return `${station.available_ports}/${station.total_ports} cổng`;
  };

  const handleBookStation = () => {
    if (selectedStation) {
      navigation.navigate('ScheduleBooking', {
        stationId: selectedStation.id,
        station: selectedStation
      });
    }
  };

  const openDirections = () => {
    if (!selectedStation) return;

    const { latitude, longitude, name } = selectedStation;

    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      Alert.alert('Lỗi', 'Không có thông tin vị trí của trạm sạc.');
      return;
    }

    // iOS - Open Apple Maps
    if (Platform.OS === 'ios') {
      const url = `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(name || 'EV Station')}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback to OpenStreetMap web
            const webUrl = `https://www.openstreetmap.org/directions?to=${latitude},${longitude}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error('Error opening maps:', err);
          Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ');
        });
    } else {
      // Android - Open OpenStreetMap in browser
      const webUrl = `https://www.openstreetmap.org/directions?to=${latitude},${longitude}`;

      Linking.openURL(webUrl)
        .catch((err) => {
          console.error('Error opening maps:', err);
          Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ');
        });
    }
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build Leaflet HTML for Android map rendering via WebView
  const buildLeafletHtml = (center, data, backgroundColor) => {
    // Provide default center if null
    const safeCenter = center || DEFAULT_LOCATION; // Default to 70 Tô Ký, Quận 12, TP.HCM

    return `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        .leaflet-container { background: ${backgroundColor}; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        (function(){
          var center = { lat: ${Number(safeCenter.latitude).toFixed(6)}, lng: ${Number(safeCenter.longitude).toFixed(6)} };
          var stations = ${JSON.stringify(data || [])};
          var map = L.map('map', { zoomControl: true }).setView([center.lat, center.lng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          stations.forEach(function(s){
            if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return;
            var m = L.marker([s.latitude, s.longitude], { title: s.name || 'EV Station' }).addTo(map);
            m.on('click', function(){
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', id: s.id }));
              }
            });
          });

          map.on('moveend', function(){
            var c = map.getCenter();
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'moveEnd', latitude: c.lat, longitude: c.lng, zoom: map.getZoom() }));
            }
          });
        })();
      </script>
    </body>
  </html>`;
  };

  const leafletHtml = useMemo(() => buildLeafletHtml(region, stations, colors.background), [region, stations, colors.background]);

  const onWebMessage = (event) => {
    try {
      const data = JSON.parse(event?.nativeEvent?.data || '{}');
      if (data.type === 'markerClick') {
        const st = stations.find((s) => s.id === data.id);
        if (st) onMarkerPress(st);
      } else if (data.type === 'moveEnd' && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const radius = 5; // km, simple default radius
        dispatch(searchStations({ lat: data.latitude, lng: data.longitude, radius }));
      }
    } catch (e) {
      // ignore parse errors
    }
  };

  if (!region) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Đang lấy vị trí của bạn...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {Platform.OS === 'ios' ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          loadingEnabled
          loadingIndicatorColor={colors.accent}
          onPress={() => dispatch(setSelectedStation(null))}
          onRegionChangeComplete={handleRegionChangeComplete}
          mapType="standard"
        >
          {stations
            .filter(station =>
              station.latitude != null &&
              station.longitude != null &&
              !isNaN(station.latitude) &&
              !isNaN(station.longitude)
            )
            .map((station) => (
              <Marker
                key={station.id}
                coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                title={station.name}
                description={`${station.available_ports}/${station.total_ports} cổng sạc có sẵn`}
                pinColor={getMarkerColor(station)}
                onPress={() => onMarkerPress(station)}
              />
            ))
          }
        </MapView>
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html: leafletHtml }}
          onMessage={onWebMessage}
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
        />
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => setShowSearch(true)}
        >
          <Icon name="search" size={20} color={colors.onSurface} style={{ opacity: 0.7 }} />
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
        <Icon name="my-location" size={24} color={colors.accent} />
      </TouchableOpacity>

      {/* List View Button */}
      <TouchableOpacity
        style={styles.listButton}
        onPress={() => navigation.navigate('StationList')}
      >
        <Icon name="list" size={24} color={colors.accent} />
      </TouchableOpacity>

      {/* Station Info Card */}
      {selectedStation && (
        <View style={styles.stationCard}>
          <View style={styles.stationHeader}>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName} numberOfLines={2} ellipsizeMode="tail">{selectedStation.name}</Text>
              <Text style={styles.stationAddress} numberOfLines={2} ellipsizeMode="tail">{selectedStation.address}</Text>
            </View>
            <View style={styles.stationHeaderActions}>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => navigation.navigate('StationDetail', { id: selectedStation.id })}
              >
                <Text style={styles.detailsButtonText}>Details</Text>
                <Icon name="arrow-forward" size={16} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => dispatch(setSelectedStation(null))}>
                <Icon name="close" size={24} color={colors.onSurface} style={{ opacity: 0.7 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stationDetails}>
            <View style={styles.detailRow}>
              <Icon name="power" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
              <Text style={styles.detailText}>
                {selectedStation.available_ports || 0}/{selectedStation.total_ports || 0} cổng sạc
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="attach-money" size={16} color={colors.onSurface} style={{ opacity: 0.7 }} />
              <Text style={styles.detailText}>
                {selectedStation.price_per_kwh !== null && selectedStation.price_per_kwh !== undefined
                  ? `${Number(selectedStation.price_per_kwh).toLocaleString()} VND/kWh`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="star" size={16} color={colors.warning} />
              <Text style={styles.detailText}>
                {selectedStation.rating !== null && selectedStation.rating !== undefined ? Number(selectedStation.rating).toFixed(1) : 'N/A'}
                <Text style={styles.detailText}> • </Text>
                {selectedStation.distance !== null && selectedStation.distance !== undefined ? `${Number(selectedStation.distance).toFixed(1)} km` : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.connectorTypes}>
            {(selectedStation.connector_types || []).map((type, index) => (
              <View key={index} style={styles.connectorBadge}>
                <Text style={styles.connectorText}>{type}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={openDirections}
            >
              <Icon name="directions" size={20} color={colors.accent} />
              <Text style={styles.directionsButtonText}>Chỉ đường</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bookButton,
                (selectedStation.available_ports || 0) === 0 && styles.disabledButton
              ]}
              onPress={handleBookStation}
              disabled={(selectedStation.available_ports || 0) === 0}
            >
              <Text style={styles.bookButtonText}>
                {(selectedStation.available_ports || 0) === 0 ? 'Hết chỗ' : 'Đặt chỗ sạc'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Modal */}
      {showSearch && (
        <View style={styles.searchModal}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={colors.onSurface} style={{ opacity: 0.7 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm trạm sạc..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Icon name="close" size={20} color={colors.onSurface} style={{ opacity: 0.7 }} />
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
                  <Text style={styles.resultName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                  <Text style={styles.resultAddress} numberOfLines={1} ellipsizeMode="tail">{item.address}</Text>
                </View>
                <Text style={styles.resultDistance}>{item.distance} km</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}


